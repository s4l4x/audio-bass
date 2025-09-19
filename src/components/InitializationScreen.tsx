import { Stack, Center, Text, Title, Box, Transition, useMantineColorScheme, Group } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import { useState } from 'react'
import { DebugMenu } from './DebugMenu'

interface InitializationScreenProps {
  onInitialize: () => Promise<void>
}

export function InitializationScreen({ onInitialize }: InitializationScreenProps) {
  const [isInitializing, setIsInitializing] = useState(false)
  const { colorScheme } = useMantineColorScheme()

  // Create unique ID for this component's CSS
  const shimmerAnimationId = 'shimmer-' + Math.random().toString(36).substr(2, 9)

  const handleInitialize = async () => {
    setIsInitializing(true)
    try {
      await onInitialize()
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      setIsInitializing(false)
    }
  }

  return (
    <>
      {/* CSS Animation */}
      <style>{`
        @keyframes ${shimmerAnimationId} {
          0% { 
            left: -200%; 
          }
          100% { 
            left: 200%; 
          }
        }
      `}</style>

      <Box
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Debug Menu - Top Right */}
        <Box style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1001 }}>
          <DebugMenu />
        </Box>

        {/* <LoadingOverlay visible={isInitializing} /> */}

        <Transition
          mounted={!isInitializing}
          transition="pop"
          duration={300}
          exitDuration={500}
        >
          {(styles) => (
            <div style={styles}>
              <Center>
                <Stack align="center" gap="xl">
                  {/* Title */}
                  <Stack align="center" gap="sm">
                    <Title
                      size="xl"
                      fw={700}
                      ta="center"
                      style={{ fontSize: 'clamp(28px, 5vw, 36px)' }}
                    >
                      DrumÜNbAss
                    </Title>
                    <Text
                      size="md"
                      ta="center"
                      style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}
                    >
                      Audio synthesis playground
                    </Text>
                  </Stack>

                  {/* Play Button with Moving Gradient */}
                  <Box
                    component="button"
                    onClick={handleInitialize}
                    disabled={isInitializing}
                    style={{
                      position: 'relative',
                      fontSize: '18px',
                      fontWeight: 600,
                      padding: '16px 32px',
                      height: 'auto',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: isInitializing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: colorScheme === 'dark'
                        ? 'var(--mantine-color-dark-9)'
                        : 'var(--mantine-color-gray-9)',
                      color: colorScheme === 'dark'
                        ? 'var(--mantine-color-dark-0)'
                        : 'white',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      transform: 'translateY(0)',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                      opacity: isInitializing ? 0.7 : 1,
                      // Mobile touch styling
                      WebkitTapHighlightColor: 'transparent',
                      WebkitTouchCallout: 'none',
                      outline: 'none',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                    onTouchStart={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)'
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                    onTouchCancel={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }
                    }}
                  >
                    {/* Moving gradient overlay */}
                    <Box
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '-200%',
                        width: '400%',
                        height: '100%',
                        background: `linear-gradient(45deg, 
                        transparent 0%, 
                        transparent 20%, 
                        ${colorScheme === 'dark' ? 'var(--mantine-color-dark-0)' : 'white'} 20.5%, 
                        ${colorScheme === 'dark' ? 'var(--mantine-color-dark-0)' : 'white'} 22%, 
                        transparent 27%, 
                        transparent 100%
                      )`,
                        opacity: 0.15,
                        animation: isInitializing ? 'none' : `${shimmerAnimationId} 2.5s infinite linear`,
                      }}
                    />

                    <Group gap="sm" align="center" style={{ position: 'relative', zIndex: 1 }}>
                      <Text component="span" size="lg" fw={600}>
                        Let's Play
                      </Text>
                      <IconPlayerPlayFilled size={24} stroke={1.5} />
                    </Group>
                  </Box>


                </Stack>
              </Center>
            </div>
          )}
        </Transition>
      </Box>
    </>
  )
}