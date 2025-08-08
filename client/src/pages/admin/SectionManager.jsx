import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateLectureMutation, useDeleteSectionMutation, useUpdateSectionMutation } from '@/features/api/courseApi';

import { Edit, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import LectureItem from './lecture/LectureItem';
import PropTypes from 'prop-types';

const SectionManager = ({ section, courseId }) => {
    const [newLectureTitle, setNewLectureTitle] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(section.title);

    const [createLecture, { isLoading: isCreatingLecture }] = useCreateLectureMutation();
    const [deleteSection, { isLoading: isDeletingSection }] = useDeleteSectionMutation();
    const [updateSection, { isLoading: isUpdatingSection }] = useUpdateSectionMutation();

    const handleAddLecture = async () => {
        if (!newLectureTitle.trim()) return;
        try {
            await createLecture({ sectionId: section._id, title: newLectureTitle, courseId }).unwrap();
            setNewLectureTitle("");
            toast.success("Lecture added!");
        } catch (err) { toast.error("Failed to add lecture."); }
    };

    const handleDeleteSection = async () => {
        if (window.confirm("Delete section and all lectures inside it? This cannot be undone.")) {
            try {
                await deleteSection({ sectionId: section._id, courseId }).unwrap();
                toast.success("Section deleted.");
            } catch (err) { toast.error("Failed to delete section."); }
        }
    };

    const handleUpdateTitle = async () => {
        if (editedTitle.trim() === section.title) { setIsEditingTitle(false); return; }
        try {
            await updateSection({ sectionId: section._id, title: editedTitle, courseId }).unwrap();
            setIsEditingTitle(false);
            toast.success("Section title updated.");
        } catch (err) { toast.error("Failed to update title."); }
    };

    return (
        <Card className="bg-muted/30">
            <Accordion type="single" collapsible className="w-full" defaultValue={`section-${section._id}`}>
                <AccordionItem value={`section-${section._id}`} className="border-b-0">
                    <div className="flex items-center px-4 py-2 bg-muted/50 rounded-t-lg">
                        {isEditingTitle ? (
                            <div className="flex-grow flex items-center gap-2"><Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onBlur={handleUpdateTitle} onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()} /><Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>Cancel</Button></div>
                        ) : (<AccordionTrigger className="flex-grow p-0 hover:no-underline font-semibold">{section.title}</AccordionTrigger>)}
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(!isEditingTitle)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={handleDeleteSection} disabled={isDeletingSection}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    <AccordionContent className="p-4 space-y-4">
                        <div className="space-y-2 border-b pb-4">
                            {section.lectures?.length > 0 ? (
                                section.lectures.map((lecture, index) => (
                                    <LectureItem key={lecture._id} lecture={lecture} courseId={courseId} index={index + 1} />
                                ))
                            ) : (<p className="text-sm text-center text-muted-foreground py-2">No lectures in this section.</p>)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Add new lecture title" value={newLectureTitle} onChange={(e) => setNewLectureTitle(e.target.value)} />
                            <Button onClick={handleAddLecture} disabled={isCreatingLecture} size="sm">
                                {isCreatingLecture ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Add Lecture
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};

SectionManager.propTypes = {
    section: PropTypes.object.isRequired,
    courseId: PropTypes.string.isRequired,
};


export default SectionManager;