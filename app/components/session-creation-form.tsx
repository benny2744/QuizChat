
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BookOpen, Target, CheckSquare } from 'lucide-react';
import { 
  SessionFormData, 
  CoreConcept,
  GRADE_LEVELS, 
  SESSION_TYPES, 
  ASSESSMENT_FOCUS_AREAS,
  DIFFICULTY_PROGRESSIONS 
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SessionCreationFormProps {
  onSessionCreated: () => void;
}

export function SessionCreationForm({ onSessionCreated }: SessionCreationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    topic: '',
    gradeLevel: '',
    sessionType: '',
    concepts: [{ name: '', examples: [''], commonMisconceptions: [''] }],
    learningObjectives: [''],
    assessmentFocus: [],
    difficultyProgression: '',
    additionalContext: ''
  });

  const addConcept = () => {
    setFormData(prev => ({
      ...prev,
      concepts: [...prev.concepts, { name: '', examples: [''], commonMisconceptions: [''] }]
    }));
  };

  const removeConcept = (index: number) => {
    setFormData(prev => ({
      ...prev,
      concepts: prev.concepts.filter((_, i) => i !== index)
    }));
  };

  const updateConcept = (index: number, field: keyof CoreConcept, value: any) => {
    setFormData(prev => ({
      ...prev,
      concepts: prev.concepts.map((concept, i) => 
        i === index ? { ...concept, [field]: value } : concept
      )
    }));
  };

  const addExample = (conceptIndex: number) => {
    const newConcepts = [...formData.concepts];
    newConcepts[conceptIndex].examples.push('');
    setFormData(prev => ({ ...prev, concepts: newConcepts }));
  };

  const removeExample = (conceptIndex: number, exampleIndex: number) => {
    const newConcepts = [...formData.concepts];
    newConcepts[conceptIndex].examples.splice(exampleIndex, 1);
    setFormData(prev => ({ ...prev, concepts: newConcepts }));
  };

  const addMisconception = (conceptIndex: number) => {
    const newConcepts = [...formData.concepts];
    newConcepts[conceptIndex].commonMisconceptions.push('');
    setFormData(prev => ({ ...prev, concepts: newConcepts }));
  };

  const removeMisconception = (conceptIndex: number, misconceptionIndex: number) => {
    const newConcepts = [...formData.concepts];
    newConcepts[conceptIndex].commonMisconceptions.splice(misconceptionIndex, 1);
    setFormData(prev => ({ ...prev, concepts: newConcepts }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.map((obj, i) => 
        i === index ? value : obj
      )
    }));
  };

  const handleAssessmentFocusChange = (area: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assessmentFocus: checked 
        ? [...prev.assessmentFocus, area]
        : prev.assessmentFocus.filter(a => a !== area)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.topic.trim() || !formData.gradeLevel || !formData.sessionType) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in topic, grade level, and session type.",
        variant: "destructive"
      });
      return;
    }

    if (formData.concepts.some(c => !c.name.trim())) {
      toast({
        title: "Missing Concept Names",
        description: "Please ensure all concepts have names.",
        variant: "destructive"
      });
      return;
    }

    if (formData.learningObjectives.some(obj => !obj.trim())) {
      toast({
        title: "Missing Learning Objectives",
        description: "Please ensure all learning objectives are filled in.",
        variant: "destructive"
      });
      return;
    }

    // Ensure at least one concept is provided
    if (formData.concepts.length === 0) {
      toast({
        title: "Missing Concepts",
        description: "Please add at least one concept.",
        variant: "destructive"
      });
      return;
    }

    // Ensure at least one learning objective is provided
    if (formData.learningObjectives.filter(obj => obj.trim()).length === 0) {
      toast({
        title: "Missing Learning Objectives",
        description: "Please add at least one learning objective.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Clean up data
      const cleanedData = {
        ...formData,
        concepts: formData.concepts.map(c => ({
          ...c,
          examples: c.examples.filter(e => e.trim()),
          commonMisconceptions: c.commonMisconceptions.filter(m => m.trim())
        })),
        learningObjectives: formData.learningObjectives.filter(obj => obj.trim())
      };

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();
      
      toast({
        title: "Session Created Successfully!",
        description: `Session code: ${session.sessionCode}. Students can now join.`
      });

      // Reset form
      setFormData({
        topic: '',
        gradeLevel: '',
        sessionType: '',
        concepts: [{ name: '', examples: [''], commonMisconceptions: [''] }],
        learningObjectives: [''],
        assessmentFocus: [],
        difficultyProgression: '',
        additionalContext: ''
      });

      onSessionCreated();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error Creating Session",
        description: "Please try again or check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Session Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle>Session Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about your educational session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic">Topic/Unit *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Marketing Fundamentals"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select 
                value={formData.gradeLevel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, gradeLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionType">Session Type *</Label>
              <Select 
                value={formData.sessionType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sessionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficultyProgression">Difficulty Progression</Label>
              <Select 
                value={formData.difficultyProgression}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficultyProgression: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select progression type" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_PROGRESSIONS.map(progression => (
                    <SelectItem key={progression} value={progression}>{progression}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Concepts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>Core Concepts (2-4) *</CardTitle>
                <CardDescription>
                  Define the key concepts students should understand
                </CardDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addConcept}>
              <Plus className="h-4 w-4 mr-2" />
              Add Concept
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.concepts.map((concept, conceptIndex) => (
            <div key={conceptIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Concept {conceptIndex + 1}</h4>
                {formData.concepts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConcept(conceptIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                <Label>Concept Name *</Label>
                <Input
                  value={concept.name}
                  onChange={(e) => updateConcept(conceptIndex, 'name', e.target.value)}
                  placeholder="e.g., Market Segmentation"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Examples</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addExample(conceptIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {concept.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="flex space-x-2">
                      <Input
                        value={example}
                        onChange={(e) => {
                          const newConcepts = [...formData.concepts];
                          newConcepts[conceptIndex].examples[exampleIndex] = e.target.value;
                          setFormData(prev => ({ ...prev, concepts: newConcepts }));
                        }}
                        placeholder="Real-world example..."
                      />
                      {concept.examples.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExample(conceptIndex, exampleIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Common Misconceptions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addMisconception(conceptIndex)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {concept.commonMisconceptions.map((misconception, misconceptionIndex) => (
                    <div key={misconceptionIndex} className="flex space-x-2">
                      <Input
                        value={misconception}
                        onChange={(e) => {
                          const newConcepts = [...formData.concepts];
                          newConcepts[conceptIndex].commonMisconceptions[misconceptionIndex] = e.target.value;
                          setFormData(prev => ({ ...prev, concepts: newConcepts }));
                        }}
                        placeholder="What students often misunderstand..."
                      />
                      {concept.commonMisconceptions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMisconception(conceptIndex, misconceptionIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle>Learning Objectives (2-3) *</CardTitle>
                <CardDescription>
                  Specific goals students should achieve
                </CardDescription>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addObjective}>
              <Plus className="h-4 w-4 mr-2" />
              Add Objective
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.learningObjectives.map((objective, index) => (
            <div key={index} className="flex space-x-2">
              <div className="flex-1">
                <Input
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder={`Learning objective ${index + 1}... *`}
                  required
                />
              </div>
              {formData.learningObjectives.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeObjective(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Assessment Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Focus Areas</CardTitle>
          <CardDescription>
            Select the skills and areas to emphasize during assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ASSESSMENT_FOCUS_AREAS.map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={area}
                  checked={formData.assessmentFocus.includes(area)}
                  onCheckedChange={(checked) => handleAssessmentFocusChange(area, checked as boolean)}
                />
                <Label htmlFor={area} className="text-sm font-medium">
                  {area}
                </Label>
              </div>
            ))}
          </div>
          {formData.assessmentFocus.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {formData.assessmentFocus.map((area) => (
                  <Badge key={area} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Context */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Context</CardTitle>
          <CardDescription>
            Any additional information about recent activities or upcoming topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.additionalContext}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
            placeholder="Recent activities, upcoming topics, special considerations..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? 'Creating Session...' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
}
