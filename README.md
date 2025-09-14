
# QuizChat - Universal Educational Chatbot Platform 🎓

An AI-powered educational chatbot platform designed for ALL academic subjects, featuring secure teacher authentication and enabling educators to conduct dynamic assessments and interactive learning sessions with 20-30 students simultaneously.

## 🌟 Features

### For Teachers
- **Secure Authentication**: Account creation, login system, and protected dashboard access
- **Universal Subject Support**: Create sessions for any academic discipline (Math, Science, History, English, etc.)
- **Session Management**: 10-session limit per teacher with organized dashboard
- **Real-time Monitoring**: Live participant tracking and session statistics
- **Assessment Scoring**: Automated understanding score calculations based on chat interactions
- **Report Generation**: Individual student reports (.md) and consolidated CSV exports
- **Analytics Dashboard**: Performance metrics and learning insights

### For Students  
- **Simple Join Process**: No authentication required - just name and session code
- **Interactive Chat**: Real-time conversation with AI tutor across any subject
- **Progressive Difficulty**: Automatic scaling from Basic → Scenario → Advanced levels
- **Academic Integrity**: Copy/paste prevention to maintain assessment validity
- **Mobile Responsive**: Works seamlessly across all devices

### AI Intelligence
- **Universal Subject Support**: Context-aware responses for any academic discipline
- **Subject-Appropriate Content**: Real-world examples tailored to the specific topic and grade level
- **Adaptive Learning**: Difficulty adjustment based on student engagement and understanding
- **Educational Focus**: Generic educational framework supporting all subjects

## 🚀 Current Status: Production Ready (v3.0.0)

✅ **Phase 1 Complete** - Core Platform
- Session creation and management
- Real-time chat with AI integration
- Student participation tracking

✅ **Phase 2 Complete** - Assessment & Reporting
- Advanced scoring algorithms
- Individual and group report generation
- Comprehensive analytics dashboard
- Session time tracking and management

✅ **Phase 3 Complete** - Authentication & Multi-Subject Platform
- Secure teacher authentication with account management
- Universal subject support for all academic disciplines
- 10-session limit per teacher with management system
- Copy/paste prevention for academic integrity
- Subject-agnostic architecture and interface

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js with credential provider and bcryptjs
- **AI Integration**: AbacusAI API (GPT-4.1-mini compatible)
- **Deployment**: Cloud-ready (Vercel, AWS, Azure compatible)

## 📊 Performance Specifications

- **Concurrent Users**: 20-30 students per session
- **Response Times**: < 2 seconds for chat interactions  
- **Scalability**: Horizontal scaling with stateless design
- **Database**: Optimized PostgreSQL with proper indexing

## 🎯 Session Types Supported

- **Pre-Assessment**: Baseline knowledge evaluation
- **Formative Check**: Quick understanding verification
- **Review Session**: Concept reinforcement
- **Unit Assessment**: Comprehensive topic evaluation
- **Final Review**: Cumulative knowledge assessment

## 📈 Universal Assessment Focus Areas

- Vocabulary Understanding (applicable to all subjects)
- Concept Application (mathematical, scientific, literary, historical, etc.)
- Critical Thinking (analysis and evaluation across disciplines)
- Problem Solving (STEM, social studies, language arts)
- Case Study Analysis (real-world applications in any subject)
- Subject Connections (interdisciplinary learning)

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- AbacusAI API key

### Installation
```bash
# Clone the repository
git clone https://github.com/benny2744/QuizChat.git
cd QuizChat

# Install dependencies  
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and API keys

# Set up database
yarn prisma generate
yarn prisma db push

# Run development server
yarn dev
```

### Environment Variables Required
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/quizchat"
ABACUSAI_API_KEY="your_api_key_here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key_here"
```

## 📁 Project Structure

```
app/
├── (routes)/
│   ├── page.tsx              # Landing page
│   ├── teacher/              # Teacher dashboard
│   └── student/              # Student interface
├── api/
│   ├── chat/                 # Chat API endpoints
│   ├── sessions/             # Session management
│   └── assessments/          # Assessment scoring
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── [feature-components]  # Custom components
├── lib/
│   ├── types.ts              # TypeScript definitions
│   ├── assessment-scoring.ts # Scoring algorithms
│   └── file-generation.ts    # Report generation
└── docs/
    ├── PRD.md                # Product Requirements
    ├── ARCHITECTURE.md       # System Architecture  
    ├── TECH_SPEC.md          # Technical Specifications
    └── CHANGELOG.md          # Version History
```

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Product Requirements Document](docs/PRD.md)** - Feature specifications and requirements
- **[Architecture Document](docs/ARCHITECTURE.md)** - System design and technical architecture  
- **[Technical Specifications](docs/TECH_SPEC.md)** - Implementation details and API documentation
- **[Changelog](docs/CHANGELOG.md)** - Version history and feature updates

## 🎮 Usage Examples

### Creating a Session (Teacher)
1. Navigate to teacher dashboard
2. Fill in topic, grade level, and learning objectives
3. Configure core concepts and assessment focus
4. Generate session code and share with students

### Joining a Session (Student)  
1. Visit student interface
2. Enter name and 6-digit session code
3. Start chatting with AI tutor
4. Progress through difficulty levels automatically

### Generating Reports (Teacher)
1. Complete session and view results dashboard
2. Generate individual student assessments (.md files)
3. Export consolidated class data (CSV format)
4. Download analytics for gradebook integration

## 🔮 Future Roadmap

### Phase 3 (Future Enhancements)
- LMS integration (Canvas, Google Classroom, Schoology)
- Mobile applications (iOS/Android)
- Advanced AI features (sentiment analysis, learning paths)
- Multi-language support
- Real-time WebSocket communications

## 🤝 Contributing

This project is currently maintained as an educational platform. For questions or suggestions, please refer to the documentation or create an issue.

## 📄 License

This project is developed for educational purposes. Please refer to the license file for usage terms.

## 📞 Support

For technical support or questions about the platform:
- Review the comprehensive documentation in `/docs`
- Check the changelog for recent updates
- Refer to the technical specifications for implementation details

---

**Built with ❤️ for educators and students**

*QuizChat - Making learning interactive, engaging, and measurable*
