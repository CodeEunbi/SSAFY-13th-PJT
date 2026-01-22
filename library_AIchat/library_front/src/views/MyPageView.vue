<template>
  <div class="profile-container">
    <h2>{{ user?.username }}님의 프로필</h2>
    <p><strong>이메일:</strong> {{ user?.email }}</p>
    <p><strong>MBTI:</strong> {{ user?.mbti }}</p>
    <p><strong>성별:</strong> {{ user?.gender }}</p>
    <p><strong>생일:</strong> {{ user?.birth_date }}</p>

    <div v-if="myThreads.length" class="my-threads">
      <h3 class="mt-4">📚 내가 작성한 쓰레드</h3>
      <div class="thread-cards">
        <RouterLink v-for="item in myThreads" :key="item.thread.id"
          :to="{ name: 'thread-detail', params: { threadId: item.thread.id } }" class="thread-card">
          <img :src="item.book.cover" alt="book cover" />
          <div class="thread-info">
            <h3>{{ item.book.title }}</h3>
            <p>{{ item.book.author }} | {{ item.book.publisher }} | {{ item.book.pub_date }}</p>
            <p class="highlight">2024 노벨문학상 수상작가</p>
          </div>
        </RouterLink>
      </div>
    </div>
    <div v-else>
      <p class="mt-4">아직 작성한 쓰레드가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import axios from 'axios'
import { useAccountStore } from '@/stores/accounts.js'

const API_URL = 'http://127.0.0.1:8000'
const route = useRoute()
const accountStore = useAccountStore()

const user = ref(null)
const myProfile = ref(false)
const myThreads = ref([])

const fetchUserProfile = function () {
  axios({
    method: 'GET',
    url: `${API_URL}/accounts/users/${route.params.userId}/`,
    headers: {
      Authorization: `Token ${accountStore.token}`
    }
  })
    .then(res => {
      user.value = res.data
      myProfile.value = res.data.id === accountStore.user?.id
    })
    .catch(err => {
      console.error('프로필 정보 불러오기 실패:', err)
    })
}

const fetchMyThreads = async function () {
  try {
    const res = await axios.get(`${API_URL}/api/v1/threads/user/${route.params.userId}/`, {
      headers: {
        Authorization: `Token ${accountStore.token}`
      }
    })
    const threads = res.data
    const threadBookPairs = await Promise.all(
      threads.map(async thread => {
        const bookRes = await axios.get(`${API_URL}/api/v1/books/${thread.book}/`)
        return { thread, book: bookRes.data }
      })
    )

    // 중복 책 제거
    const bookMap = new Map()
    for (const pair of threadBookPairs) {
      const bookId = pair.book.id
      if (!bookMap.has(bookId)) {
        bookMap.set(bookId, pair)
      }
    }
    myThreads.value = Array.from(bookMap.values())
  } catch (err) {
    console.error('내 쓰레드 목록을 불러오지 못했습니다.', err)
  }
}

onMounted(async () => {
  if (!accountStore.token) {
    console.warn('토큰이 없어서 사용자 정보를 불러올 수 없습니다.')
    return
  }
  if (!accountStore.user) {
    await accountStore.fetchUser()
  }
  fetchUserProfile()
  fetchMyThreads()
})
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background-color: rgb(238, 238, 238);
  width: 500px;
  /* ✅ 최소 가로 길이 설정 */
  margin: 30px auto;
  padding: 40px;
  color: black;
  display: flex;
  flex-direction: column;
  /* min-height: 100vh; */
  border-radius: 10px;
}

.mt-4 {
  margin-top: 2rem;
}

.thread-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 1.5rem;
  justify-content: center;
  align-items: center;
}

.thread-card {
  display: flex;
  background-color: #2a2a2a;
  border-radius: 12px;
  padding: 16px;
  max-width: 600px;
  width: 100%;
  color: #e0e0e0;
  text-decoration: none;
}

.thread-card img {
  width: 100px;
  height: 150px;
  margin-right: 24px;
  object-fit: cover;
  border-radius: 4px;
}

.thread-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 3;
}

.thread-info h3 {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.thread-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #bbbbbb;
}

.thread-info .highlight {
  margin-top: 8px;
  font-size: 13px;
  color: white;
  font-weight: 500;
}
</style>