export interface Profile {
  id: string
  email: string
  full_name: string | null
  date_of_birth: string | null
  country: string | null
  phone: string | null
  gender: string | null
  student_id: string | null
  profile_picture_url: string | null
  is_profile_complete: boolean
  year_of_study: number | null
  course_name: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  code: string
  name: string
  description: string | null
  credits: number
  instructor: string | null
  department: string | null
  duration_weeks: number | null
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  status: 'active' | 'completed' | 'dropped'
  course?: Course
}

export interface Grade {
  id: string
  student_id: string
  course_id: string
  assignment_name: string
  score: number
  max_score: number
  grade_type: 'assignment' | 'midterm' | 'final' | 'quiz'
  graded_at: string
  course?: Course
}

export interface AttendanceRecord {
  id: string
  student_id: string
  course_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes: string | null
  course?: Course
}

export interface FeeBalance {
  id: string
  student_id: string
  total_fees: number
  amount_paid: number
  balance: number
  due_date: string | null
  updated_at: string
}

export interface Payment {
  id: string
  student_id: string
  amount: number
  payment_method: string | null
  reference: string
  status: 'pending' | 'completed' | 'failed'
  description: string | null
  paid_at: string
}

export interface DocumentRequest {
  id: string
  student_id: string
  document_type: 'transcript' | 'certificate' | 'letter'
  reason: string | null
  status: 'pending' | 'processing' | 'ready' | 'delivered'
  requested_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  sent_at: string
  sender?: Profile
  receiver?: Profile
}

export interface ForumThread {
  id: string
  author_id: string
  title: string
  content: string
  category: string | null
  views: number
  is_pinned: boolean
  created_at: string
  updated_at: string
  author?: Profile
  post_count?: number
}

export interface ForumPost {
  id: string
  thread_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface CourseMaterial {
  id: string
  course_id: string
  title: string
  description: string | null
  material_type: 'video' | 'document' | 'link' | 'assignment'
  content_url: string | null
  content: string | null
  week_number: number | null
  order_index: number
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  event_date: string
  end_date: string | null
  category: string | null
  image_url: string | null
  max_attendees: number | null
  created_at: string
  is_registered?: boolean
  attendee_count?: number
}
