from django.urls import path, include
from . import views

app_name = 'books'

urlpatterns = [
    # path('', views.book_root),
    path('threads/', views.thread_list, name='thread_list'),
    path('threads/user/<int:user_id>/', views.user_threads, name='user_threadS'),
    path('threads/<int:thread_id>/', views.thread_detail, name='thread_detail'),
    path('<int:book_id>/threads/', views.create_thread, name='create_thread'),
    path('books/<int:book_id>/', views.book_detail, name='book_detail'),
    path('threads/public/', views.public_latest_threads, name='thread_latest'),

    
]