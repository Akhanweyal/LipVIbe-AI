
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderOpen, Save, Trash2, Edit, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ProjectManagerProps {
  onProjectCreate: (project: any) => void;
  onProjectLoad: (project: any) => void;
  currentProject: any;
}

export function ProjectManager({ onProjectCreate, onProjectLoad, currentProject }: ProjectManagerProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a name for your project.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      setProjects(prev => [project, ...prev]);
      onProjectCreate(project);
      setIsCreateDialogOpen(false);
      setNewProject({ name: '', description: '' });

      toast({
        title: "Project Created",
        description: `Project "${project.name}" has been created successfully.`,
      });

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Creation Failed",
        description: "There was an error creating your project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadProject = (project: any) => {
    onProjectLoad(project);
    setIsLoadDialogOpen(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
      });

    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-900/20';
      case 'processing':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'failed':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Current Project Display */}
      {currentProject && (
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-purple-900/30 rounded-lg border border-purple-500/30">
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <span className="text-sm text-white font-medium">{currentProject.name}</span>
        </div>
      )}

      {/* Create Project Button */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Project</DialogTitle>
            <DialogDescription className="text-gray-300">
              Start a new AI video editing project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-white">Project Name</Label>
              <Input
                id="project-name"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-white">Description (Optional)</Label>
              <Textarea
                id="project-description"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project..."
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Project Button */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Project
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Load Project</DialogTitle>
            <DialogDescription className="text-gray-300">
              Select a project to continue working on
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400">No projects found</p>
                <p className="text-sm text-gray-500">Create your first project to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1" onClick={() => handleLoadProject(project)}>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-white">{project.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                            </div>
                            {project.description && (
                              <p className="text-sm text-gray-300 mb-2">{project.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Created {formatDate(project.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Updated {formatDate(project.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
