<template>
  <div class="full-page-wrapper">
    <div class="threads-list-view">

      <div class="category-menu">
        <ul>
          <li :class="{ active: selectedCategory === '전체' }" @click="filterThreads('전체')">
            전체
          </li>
          <li v-for="category in categories.filter(c => c.fields.name !== '전체')" :key="category.pk"
            :class="{ active: selectedCategory === category.fields.name }" @click="filterThreads(category.fields.name)">
            {{ category.fields.name }}
          </li>
        </ul>
      </div>

      <main class="thread-display">
        <div class="thread-grid">
          <RouterLink v-for="thread in filteredThreads" :key="thread.id"
            :to="{ name: 'thread-detail', params: { threadId: thread.id } }" class="thread-card">
            <img
              src="https://plus.unsplash.com/premium_photo-1746420146082-4ae58de636e9?q=80&w=1388&auto=format&fit=crop"
              :alt="thread.title" class="thread-cover" />
            <div class="thread-info">
              <h3 class="title">{{ thread.title }}</h3>
              <p class="content">
                {{ thread.content.length > 120 ? thread.content.slice(0, 120) + '...' : thread.content }}
              </p>
            </div>
          </RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { RouterLink } from 'vue-router'
import axios from 'axios'
import threadsData from '@/assets/fixtures/threads.json'
import booksData from '@/assets/fixtures/books.json'
import categoriesData from '@/assets/fixtures/categories.json'

export default {
  name: 'ThreadsListView',
  components: {
    RouterLink,
  },
  data() {
    return {
      threads: [],
      books: booksData,
      categories: categoriesData,
      searchQuery: '',
      selectedCategory: '전체',
    }
  },
  computed: {
    selectedCategoryId() {
      if (this.selectedCategory === '전체') return null
      const found = this.categories.find(
        (c) => c.fields.name === this.selectedCategory
      )
      return found ? found.pk : null
    },
    filteredThreads() {
      return this.threads.filter((thread) => {
        const book = this.books.find(b => b.pk === thread.book)
        if (!book) return false

        const categoryMatches =
          this.selectedCategory === '전체' ||
          book.fields.category === this.selectedCategoryId

        const searchMatches =
          thread.title &&
          thread.title.toLowerCase().includes(this.searchQuery.toLowerCase())

        return categoryMatches && searchMatches
      })
    }
  },
  methods: {
    filterThreads(categoryName) {
      this.selectedCategory = categoryName
    },
    fetchThreads() {
      const token = localStorage.getItem('token')
      axios.get('http://127.0.0.1:8000/api/v1/threads/', {
        headers: {
          Authorization: `Token ${token}`,  // yourToken 변수에 실제 토큰 문자열 넣기
        }
      })
        .then(res => {
          this.threads = res.data
        })
        .catch(err => {
          console.error('서버 쓰레드 불러오기 실패:', err)
          this.threads = []
        })
    }
  },
  mounted() {
    this.fetchThreads()
  },
}
</script>


<style scoped>
.full-page-wrapper {
  height: 100vh;
  background-color: #1c1c1e;
  color: white;
  overflow: auto;
}

.threads-list-view {
  display: flex;
  flex-direction: column;
  justify-self: center;
  width: 70%;
}

.category-menu ul {
  display: flex;
  flex-direction: row;
  justify-content: center;
  list-style: none;
  padding: 32px;
}

.category-menu li {
  margin: 5px;
  padding: 3px 13px;
  border: solid rgba(235, 235, 235, 0.452) 1px;
  border-radius: 30px;
  cursor: pointer;
}

.category-menu li.active {
  background-color: red;
  color: white;
  border: solid red 1px;
  font-weight: bold;
}

.thread-display {
  flex-grow: 1;
  padding: 32px;
  background-color: #1c1c1e;
}

.thread-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.thread-card {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  gap: 16px;
  height: 300px;
  color: inherit;
}

.thread-cover {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.thread-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 6px;
  color: black;
}

.meta {
  font-size: 12px;
  color: gray;
  margin-bottom: 6px;
}

.content {
  text-align: center;
  font-size: 12px;
  color: black;
}
</style>
