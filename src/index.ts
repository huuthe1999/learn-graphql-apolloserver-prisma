import dotenv from 'dotenv-safe'

import { add, AnotherBook } from '@utils'

import { randomUUID } from 'crypto'

dotenv.config({ allowEmptyValues: true })

type Book = {
  title: string
  author: string
}

const book: Book = {
  title: 'Cool Book',
  author: 'John Doe',
}

const id = randomUUID()

const book2: AnotherBook = {
  title: 'Cool Book2',
  author: 'John Doe2',
}

console.log(book, book2, id, add(7, 4), process.env.SECRET)

export {}
