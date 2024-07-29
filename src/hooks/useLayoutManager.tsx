'use client';
import { useEffect, useState } from 'react'

// Custom hook for layout management
const useLayoutManager = (isLoggedIn: boolean) => {
    const [showSidebar, setShowSidebar] = useState(true)
    const [showTopBar, setShowTopBar] = useState(true)
  
    const toggleSidebar = () => setShowSidebar(prev => !prev)
    const toggleTopBar = () => setShowTopBar(prev => !prev)
  
    useEffect(() => {
      if (!isLoggedIn) {
        setShowSidebar(false)
        setShowTopBar(false)
      }
    }, [isLoggedIn])
  
    return { showSidebar, showTopBar, toggleSidebar, toggleTopBar }
  }

export default useLayoutManager