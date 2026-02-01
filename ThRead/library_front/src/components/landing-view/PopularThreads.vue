<template>
    <div>
        <h3 class="section-title text-center mb-4">최신 쓰레드 3개</h3>

        <div class="thread-grid">
            <RouterLink v-for="item in newThreads" :key="item.thread.id"
                :to="{ name: 'thread-detail', params: { threadId: item.thread.id } }" class="thread-card">
                <img :src="item.book.cover" alt="book cover" />
                <div class="thread-info">
                    <h6>{{ item.book.title }}</h6>
                    <p>{{ item.book.author }} | {{ item.book.publisher }} | {{ item.book.pub_date }}</p>
                    <p class="highlight">2024 노벨문학상 수상작가</p>
                </div>
            </RouterLink>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'

const newThreads = ref([])

const fetchNewThreads = async () => {
    try {
        // 모든 쓰레드 불러오기 (로그인 토큰 없이 가능해야 함)
        const res = await axios.get(`${API_URL}/api/v1/threads/public`)
        let threads = res.data

        // 최신 순으로 정렬 (작성일(created_at) 필드가 있다면 그걸로 정렬, 없으면 id 내림차순)
        threads.sort((a, b) => b.id - a.id)

        // 최신 3개만 선택
        threads = threads.slice(0, 3)

        // 각각 쓰레드의 도서 정보 요청
        const threadBookPairs = await Promise.all(
            threads.map(async thread => {
                const bookRes = await axios.get(`${API_URL}/api/v1/books/${thread.book}/`)
                return { thread, book: bookRes.data }
            })
        )

        newThreads.value = threadBookPairs

    } catch (error) {
        console.error('최신 쓰레드 3개를 불러오지 못했습니다.', error)
    }
}

onMounted(() => {
    fetchNewThreads()
})
</script>

<style scoped>
.section-title {
    font-family: 'GmarketSansTTFMedium';
}


.thread-grid {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
}



.thread-card {
    display: flex;
    flex-direction: column;
    width: 200px;
    text-decoration: none;
    color: inherit;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    background: white;
}

.thread-card img.thread-cover {
    width: 100%;
    height: 250px;
    object-fit: cover;
}

.thread-info {
    padding: 10px;
    color: black;
}

.title {
    margin: 0;
    font-weight: bold;
    font-size: 1.1em;
}

.content {
    font-size: 0.9em;
    color: #444;
    margin-top: 6px;
}

.highlight {
    color: red;
    font-weight: bold;
}
</style>
