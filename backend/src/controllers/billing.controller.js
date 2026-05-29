import Stripe from 'stripe'
import { prisma } from '../lib/prisma.js'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY)

// ─── POST /api/billing/checkout ──────────────────────────────────────────────
export const createCheckoutSession = async (req, res) => {
  try {
    const stripe = getStripe()
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (user.plan === 'pro') {
      return res.status(400).json({ message: 'Already on Pro plan' })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1
      }],
      success_url: `${process.env.CLIENT_URL}/settings?upgraded=true`,
      cancel_url: `${process.env.CLIENT_URL}/settings`,
      metadata: { userId: user.id }
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('createCheckoutSession error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

// ─── POST /api/billing/portal ─────────────────────────────────────────────────
export const createPortalSession = async (req, res) => {
  try {
    const stripe = getStripe()
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ message: 'No billing account found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/settings`
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('createPortalSession error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

// ─── GET /api/billing/status ──────────────────────────────────────────────────
export const getBillingStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true, stripeCustomerId: true }
    })
    res.json({ plan: user.plan, hasStripe: !!user.stripeCustomerId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// ─── POST /api/billing/webhook ────────────────────────────────────────────────
export const handleWebhook = async (req, res) => {
  const stripe = getStripe()
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ message: err.message })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await prisma.user.update({
          where: { id: session.metadata.userId },
          data: { plan: 'pro', stripeCustomerId: session.customer }
        })
        console.log('User upgraded to Pro:', session.metadata.userId)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer }
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: 'free' }
          })
          console.log('User downgraded to Free:', user.id)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.warn('Payment failed for customer:', invoice.customer)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message)
  }

  res.json({ received: true })
}