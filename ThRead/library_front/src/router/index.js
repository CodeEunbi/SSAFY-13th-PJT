// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import BookDetailView from '@/views/BookDetailView.vue'
import BooksListView from '@/views/BooksListView.vue'
import ThreadsListView from '@/views/ThreadsListView.vue'
import ThreadDetailView from '@/views/ThreadDetailView.vue'
import ThreadWriteView from '@/views/ThreadWriteView.vue'
import ChatBotView from '@/views/ChatBotView.vue'
// import ChatBotView from '@/components/ai-chat/ChatBotView.vue'
import SignUpView from '@/views/SignUpView.vue'
import LogInView from '@/views/LogInView.vue'
import MyPageView from '@/views/MyPageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing-view',
      component: LandingView,
    },
    {
      path: '/books',
      name: 'books-list',
      component: BooksListView,
    },
    {
      path: '/books/:bookId',
      name: 'book-detail',
      component: BookDetailView,
      props: true,
    },
    {
      path: '/threads',
      name: 'threads-list',
      component: ThreadsListView,
    },
    {
      path: '/threads/:threadId',
      name: 'thread-detail',
      component: ThreadDetailView,
    },
    {
      path: '/threads/:bookId/write',
      name: 'thread-write',
      component: ThreadWriteView,
    },
    {
      path: '/books/:bookId/chat',
      name: 'chatbot',
      component: ChatBotView,
      props: true,
    },

    // 유저 관련 페이지
    {
      path: '/signup',
      name: 'signup',
      component: SignUpView,
    },
    {
      path: '/login',
      name: 'login',
      component: LogInView,
    },
    {
      path: '/mypage/:userId',
      name: 'mypage',
      component: MyPageView,
    }


    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

export default router
