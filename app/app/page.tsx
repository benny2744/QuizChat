
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EduChat</h1>
                <p className="text-sm text-gray-600">Dynamic Learning Sessions</p>
              </div>
            </div>
            <nav className="flex space-x-4">
              <Link href="/teacher">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Teacher Dashboard
                </Button>
              </Link>
              <Link href="/student">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Join Session
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Business Education with 
            <span className="text-blue-600"> AI-Powered Learning</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Create dynamic quiz sessions for high school business classes. 
            Support 20-30 concurrent students with progressive difficulty questioning and real-time assessment.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/teacher">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Users className="mr-2 h-5 w-5" />
                Start Teaching
              </Button>
            </Link>
            <Link href="/student">
              <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <BookOpen className="mr-2 h-5 w-5" />
                Join as Student
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-3">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg w-fit mx-auto mb-3">
                <BookOpen className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg">Session Creation</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Comprehensive template-based session setup with core concepts and learning objectives
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-3">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-fit mx-auto mb-3">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg">Interactive Chat</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                AI-powered educational conversations with progressive difficulty levels
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-3">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg w-fit mx-auto mb-3">
                <Users className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg">Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Monitor 20-30 concurrent students with live participant tracking
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-3">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-lg w-fit mx-auto mb-3">
                <BarChart3 className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg">Assessment Reports</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600">
                Generate individual .md files and consolidated CSV reports
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Create Session</h4>
              <p className="text-gray-600">
                Teachers set up sessions with structured templates including core concepts and learning objectives
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 text-green-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Students Join</h4>
              <p className="text-gray-600">
                Students enter with just their name and session code - simple and fast
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 text-purple-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold mb-2">Learn & Assess</h4>
              <p className="text-gray-600">
                AI adapts difficulty from Basic → Scenario → Advanced based on performance
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">
            EduChat - Transforming Education Through AI-Powered Learning
          </p>
        </div>
      </footer>
    </div>
  );
}
