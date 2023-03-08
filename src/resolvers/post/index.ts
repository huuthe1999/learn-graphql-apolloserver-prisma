import { Arg, Authorized, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql'

import { MyContext, PostMutationResponse } from '@types'

import {
  applyArgsTypesEnhanceMap,
  applyInputTypesEnhanceMap,
  applyResolversEnhanceMap,
  PostCreateInput
} from '@generated'

import { IsInt, IsNotEmpty, IsNotEmptyObject, ValidateNested } from 'class-validator'

import { customClassValidatorError, ValidationError } from '@utils'

import { CREATE_POST_FAILED, POST_NOT_FOUND } from '@constants'

applyResolversEnhanceMap({
  Post: {
    _all: [
      Authorized(),
      UseMiddleware(({ info }, next) => {
        console.log(`Query "${info.fieldName}" accessed`)

        return next()
      })
    ],
    createOnePost: [
      UseMiddleware(async (_, next) => {
        try {
          return await next()
        } catch (err) {
          const error = customClassValidatorError(err)

          return error ? error : new ValidationError('Failed to create post', CREATE_POST_FAILED)
        }
      })
    ],
    deleteOnePost: [
      UseMiddleware(async (_, next) => {
        try {
          return await next()
        } catch (err) {
          // throw new GraphQLError('Post not found', {
          //   extensions: {
          //     code: POST_NOT_FOUND
          //   }
          // })

          const error = customClassValidatorError(err)

          return error ? error : new ValidationError('Post not found', POST_NOT_FOUND)
        }
      })
    ]
  }
})

applyArgsTypesEnhanceMap({
  CreateOnePostArgs: {
    fields: {
      data: [ValidateNested(), IsNotEmptyObject()]
    }
  },
  DeleteOnePostArgs: {
    fields: {
      _all: [ValidateNested()]
    }
  }
})

applyInputTypesEnhanceMap({
  PostCreateInput: {
    fields: {
      title: [IsNotEmpty()]
    }
  },
  PostWhereUniqueInput: {
    fields: {
      id: [IsInt()]
    }
  }
})

@Resolver()
export class PostResolver {
  @Mutation(_return => PostMutationResponse)
  async createNewPost(
    @Arg('data')
    newPostData: PostCreateInput,
    @Ctx() { prisma, req }: MyContext
  ): Promise<PostMutationResponse> {
    if (!req.session.userId || req.session.userId !== newPostData.author.connect?.id)
      return {
        isSuccess: false,
        status: 401,
        message: 'Unauthenticated'
      }

    try {
      const newPost = await prisma.post.create({
        data: {
          ...newPostData
        }
      })

      return {
        isSuccess: true,
        status: 200,
        post: newPost,
        message: 'Create post successful'
      }
    } catch (error) {
      return {
        isSuccess: false,
        status: 500,
        message: 'Post not found'
      }
    }
  }
}
