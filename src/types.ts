export type Site = {
  title: string
  description: string
  href?: string
  featuredPostCount?: number
  postsPerPage?: number
  locale?: string
  dir?: string
  defaultPageImage?: string
  defaultPostImage?: string
}

export type NavigationLink = {
  href: string
  label: string
}

export type SocialLink = {
  href: string
  label: string
}
