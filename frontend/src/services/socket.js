import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true
})

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect()
    socket.emit('join_feed')
  }
}

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect()
}