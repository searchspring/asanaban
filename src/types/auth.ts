
export interface User {
  email: string
  gid: string
  id: number
  name: string
}

export interface Session {
  access_token: string
  data: User
  expires_in: number
  refresh_token: string
  token_type: string
}