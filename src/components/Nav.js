import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Icon,
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { HiMenu, HiX, HiChevronDown, HiChevronRight } from "react-icons/hi";
import { FaInstagram } from "react-icons/fa";
import { useParams, Link } from "react-router-dom";

export default function WithSubnavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = () => setIsOpen(!isOpen);

  // Close mobile menu when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        // md breakpoint is 768px
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  return (
    <Box w="100%" maxW="100vw" overflow="hidden" id="navbar">
      <Flex
        py={4}
        px={8}
        align={"center"}
        w="100%"
        maxW="100%"
        overflow="hidden"
        boxSizing="border-box"
      >
        <Flex flex="0 0 auto" mr={1} display={{ base: "flex", md: "none" }}>
          <button
            onClick={onToggle}
            minW="auto"
            aria-label={"Toggle Navigation"}
            className="btnMenu"
          >
            {isOpen ? <HiX size={24} /> : <HiMenu size={23} />}
          </button>
        </Flex>
        <Flex
          flex="1 1 0"
          justify={{ base: "center", md: "start" }}
          minW="0"
          height="30px"
        >
          <img src={`/logo.png`} alt={`Logo`} />

          <Flex align={"center"} display={{ base: "none", md: "flex" }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          flex="0 0 auto"
          justify={"flex-end"}
          direction={"row"}
          spacing={2}
          mr={1}
        >
          <Box fontSize="14px">
            <a
              href="https://www.instagram.com/saras._.photos?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram size={20} />
            </a>
          </Box>
        </Stack>
      </Flex>

      {isOpen && (
        <Box display={{ base: "block", md: "none" }}>
          <MobileNav onClose={() => setIsOpen(false)} />
        </Box>
      )}
    </Box>
  );
}

const DesktopNav = () => {
  return (
    <Stack direction={"row"} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <PopoverRoot openOnHover placement={"bottom-start"}>
            <PopoverTrigger>
              <Box
                as={Link}
                to={navItem.href ?? "/"}
                p={2}
                fontSize={"sm"}
                fontWeight={500}
                _hover={{
                  textDecoration: "none",
                }}
              >
                {navItem.label}
              </Box>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow="xl"
                p={4}
                rounded="xl"
                w="100%"
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </PopoverRoot>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }) => {
  return (
    <Box
      as="a"
      href={href}
      role={"group"}
      display={"block"}
      p={2}
      rounded={"md"}
      _hover={{ bg: "pink.50" }}
    >
      <Stack direction={"row"} align={"center"}>
        <Box>
          <Text transition={"all .3s ease"} fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={"sm"}>{subLabel}</Text>
        </Box>
        <Flex
          transition={"all .3s ease"}
          transform={"translateX(-10px)"}
          opacity={0}
          _groupHover={{ opacity: "100%", transform: "translateX(0)" }}
          justify={"flex-end"}
          align={"center"}
          flex={1}
        >
          <Icon w={5} h={5} as={HiChevronRight} />
        </Flex>
      </Stack>
    </Box>
  );
};

const MobileNav = ({ onClose }) => {
  return (
    <Stack id="navMobile" p={8} display={{ md: "none" }}>
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} onClose={onClose} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = () => setIsOpen(!isOpen);

  const handleNavClick = () => {
    if (!children && onClose) {
      onClose(); // Close mobile menu when clicking a nav item without children
    }
  };

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Box
        py={2}
        as={Link}
        to={href ?? "/"}
        justifyContent="space-between"
        alignItems="center"
        _hover={{
          textDecoration: "none",
        }}
        onClick={handleNavClick}
      >
        <Text fontWeight={600}>{label}</Text>
        {children && (
          <Icon
            as={HiChevronDown}
            transition={"all .25s ease-in-out"}
            transform={isOpen ? "rotate(180deg)" : ""}
            w={6}
            h={6}
          />
        )}
      </Box>

      {isOpen && children && (
        <Stack mt={2} pl={4} align={"start"}>
          {children.map((child) => (
            <Box
              as={Link}
              key={child.label}
              py={2}
              to={child.href}
              onClick={onClose} // Close menu when clicking sub-nav item
            >
              {child.label}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

const NAV_ITEMS = [
  {
    label: "Início",
    href: "/",
  },
  {
    label: "Sara Ferreira",
    href: "/about",
  },
  {
    label: "Portefólio",
    href: "/portfolio",
  },
  {
    label: "Sessões",
    href: "/sessions",
  },
  {
    label: "Encomendas",
    href: "/orders",
  },
];
