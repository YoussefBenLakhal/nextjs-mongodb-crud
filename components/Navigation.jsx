import {
  Flex,
  Text,
  Button,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  Stack,
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import Link from 'next/link'
import { clientLogout } from '@/lib/client-auth';

export default function Navigation({ session }) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding="1.5rem"
        bg="white"
        boxShadow="sm"
      >
        <Link href="/">
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            EduPortal
          </Text>
        </Link>

        <Flex display={{ base: 'none', md: 'flex' }} align="center">
          {session ? (
            <>
              <Button variant="ghost" mr={4} as={Link} href="/dashboard">
                Dashboard
              </Button>
              <Button onClick={() => {
                localStorage.removeItem('currentUser');
                clientLogout();
                window.location.reload(); // Force full refresh
              }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" mr={4} as={Link} href="/login">
                Login
              </Button>
              <Button colorScheme="brand" as={Link} href="/register">
                Register
              </Button>
            </>
          )}
        </Flex>

        <IconButton
          display={{ md: 'none' }}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          onClick={isOpen ? onClose : onOpen}
          variant="outline"
          aria-label="Menu"
        />
      </Flex>

      <MobileDrawer isOpen={isOpen} onClose={onClose} session={session} />
    </>
  )
}

const MobileDrawer = ({ isOpen, onClose, session }) => (
  <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
    <DrawerOverlay />
    <DrawerContent>
      <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
      <DrawerBody>
        <Stack spacing={4}>
          {session ? (
            <>
              <Button as={Link} href="/dashboard" variant="ghost">
                Dashboard
              </Button>
              <Button colorScheme="brand" onClick={signOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} href="/login" variant="ghost">
                Login
              </Button>
              <Button colorScheme="brand" as={Link} href="/register">
                Register
              </Button>
            </>
          )}
        </Stack>
      </DrawerBody>
    </DrawerContent>
  </Drawer>
)