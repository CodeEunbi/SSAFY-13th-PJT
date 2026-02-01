<template>
  <div class="back" v-if="!loading && book">
    <div class="page-wrapper">
      <div class="title-row">
        <h1 class="title">{{ book.title }}</h1>
        <RouterLink :to="{ name: 'thread-write', params: { bookId: book.id } }" class="write-thread-button">
          스레드 작성하기
        </RouterLink>
      </div>

      <div class="content-box">
        <div class="detail-container">
          <div class="left">
            <img :src="book.cover" alt="book cover" class="cover" />
          </div>
          <div class="right">
            <p class="description">{{ book.description }}</p>
            <p><strong>출판사:</strong> {{ book.publisher }}</p>
            <p><strong>출판일:</strong> {{ book.pub_date }}</p>
            <p><strong>ISBN:</strong> {{ book.isbn }}</p>
            <p><strong>고려 리뷰 평점:</strong> {{ book.customer_review_rank }}</p>
            <p><strong>카테고리:</strong> {{ book.category?.name }}</p>
            <p v-if="book.subTitle"><strong>부제목:</strong> {{ book.subTitle }}</p>
          </div>
        </div>

        <div class="author-info">
          <h2>작가 정보</h2>
          <div class="author-box">
            <img :src="book.author_photo" alt="작가" class="author-img" />
            <div class="author-text">
              <p class="author-name"><strong>{{ book.author }}</strong></p>
              <p class="author-bio">{{ book.author_info }}</p>
            </div>
          </div>
        </div>

        <div class="thread">
          <div class="threads-list">
            <h2>감상평</h2>
            <hr />
            <div v-if="book.threads && book.threads.length > 0">
              <ul>
                <li v-for="thread in book.threads" :key="thread.id">
                  <RouterLink :to="{ name: 'thread-detail', params: { threadId: thread.id } }" class="thread-link">
                    <strong>{{ thread.title }}</strong> - {{ thread.userDetail?.username || '익명' }}
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div v-else>
              <RouterLink :to="{ name: 'thread-write', params: { bookId: book.id } }" class="write-thread-button">
                아직 감상평이 없습니다! 작성하러가기
              </RouterLink>
            </div>
          </div>
        </div>

        <ChatBotLauncher v-if="[1, 2, 3, 4].includes(book.category?.id)" :book="book" />
      </div>
    </div>
  </div>

  <div v-else-if="loading">로딩중...</div>
  <div v-else-if="error">{{ error }}</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ChatBotLauncher from '@/components/ai-chat/ChatBotLauncher.vue'

const props = defineProps(['bookId'])
const bookId = parseInt(props.bookId)

const book = ref(null)
const loading = ref(true)
const error = ref(null)

const API_URL = 'http://127.0.0.1:8000/api/v1'

onMounted(async () => {
  try {
    const res = await axios.get(`${API_URL}/books/${bookId}/`)
    book.value = res.data
    console.log('book 전체:', book.value)
    console.log('category:', book.value.category)
    console.log('category id:', book.value.category?.id)
    const threads = book.value.threads || []

    // 사용자 정보를 저장할 맵 (중복 요청 방지용)
    const userMap = {}

    // 모든 유저 id를 순회하면서 정보 요청
    for (const thread of threads) {
      const userId = thread.user
      if (userId && !userMap[userId]) {
        try {
          const userRes = await axios.get(`http://127.0.0.1:8000/accounts/users/${userId}/`)
          userMap[userId] = userRes.data
        } catch (e) {
          userMap[userId] = { username: '알 수 없음' }
        }
      }
      // 사용자 정보 병합
      thread.userDetail = userMap[userId]
    }

  } catch (e) {
    error.value = '책 정보를 불러오는 중 오류가 발생했습니다.'
    console.error(e)
  } finally {
    loading.value = false
  }
})

</script>


<style scoped>
.back {
  background-color: #f0f0f0;
  min-height: 100vh;
  padding: 40px 0;
  color: black;
}

.thread {
  background-color: #f0f0f0;
  padding: 40px;
  color: black;
  border-radius: 5px;
}

.threads-list li {
  list-style: none;
}

.page-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.write-thread-button {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #ff3b3b;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
}

.content-box {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.detail-container {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}

.cover {
  width: 180px;
  border-radius: 8px;
  object-fit: cover;
}

.right {
  flex: 1;
  font-size: 15px;
  line-height: 1.6;
}

.description {
  margin-bottom: 12px;
  white-space: pre-line;
}

.author-info h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.author-box {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
}

.author-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 50%;
}

.author-text {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.author-bio {
  font-size: 14px;
  line-height: 1.6;
}
</style>
