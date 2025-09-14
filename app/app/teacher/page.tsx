
import { TeacherDashboard } from "@/components/teacher-dashboard";
import { AuthWrapper } from "@/components/auth-wrapper";

export default function TeacherPage() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <TeacherDashboard />
      </div>
    </AuthWrapper>
  );
}
