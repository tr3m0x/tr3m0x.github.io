import type { Site, NavigationLink, SocialLink } from "./types"

export const SITE: Site = {
  title: 'tr3m0x',
  description: 'Writeups, CTF solutions, and cheatsheets.',
  href: 'https://tr3m0x.github.io',
  featuredPostCount: 3,
  postsPerPage: 10,
  locale: 'en-US', 
  dir: 'ltr',
  defaultPageImage: '/default-og-page.png',
  defaultPostImage: '/default-og-post.png',
}

export const NAVIGATION: NavigationLink[] = [
  { href: '/blog', label: 'blog' },
  { href: '/tags', label: 'tags' },
  { href: '/about', label: 'about' },
]

export const SOCIALS: SocialLink[] = [
  { href: 'https://github.com/tr3m0x', label: 'GitHub' },
  { href: 'https://linkedin.com/in/leithgritli', label: 'LinkedIn' },
  { href: 'mailto:leithgritli999@gmail.com', label: 'Email' },
]
