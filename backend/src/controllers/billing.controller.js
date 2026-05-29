import Stripe from 'stripe'
import { prisma } from '../lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const createCheckoutSession = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })

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
    res.status(500).json({ message: err.message })
  }
}

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    await prisma.user.update({
      where: { id: session.metadata.userId },
      data: { plan: 'pro', stripeCustomerId: session.customer }
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer }
    })
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'free' }
      })
    }
  }

  res.json({ received: true })
}