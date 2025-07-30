import React, { useState, useEffect, useRef } from 'react';

export function useBroadcastChannel({ channelName = 'video-conf', onMessage }) {
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = new BroadcastChannel(channelName)
    channelRef.current = channel

    channel.onmessage = (event) => {
      onMessage?.(event.data)
    }

    return () => {
      channel.close()
    }
  }, [channelName, onMessage])

  const postMessage = (message) => {
    if (channelRef.current) {
      channelRef.current.postMessage(message)
    }
  }

  return { postMessage }
}