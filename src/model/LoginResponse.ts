export type LoginResponse = {
    token: string
    user: {
        id: number
        email: string
        name: string
        picture: string
    }
}