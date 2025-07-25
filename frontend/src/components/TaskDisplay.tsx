import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    TablePagination,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { VetOutput } from '../types/schemas';

interface TaskDisplayProps {
    data: VetOutput;
}

const TaskDisplay: React.FC<TaskDisplayProps> = ({ data }) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 5;

    // Destructure with default empty arrays
    const {
        soap_notes = [],
        follow_up_tasks = [],
        medication_instructions = [],
        client_reminders = [],
        vet_todos = [],
        warnings = [],
    } = data;

    const paginatedTasks = (arr: any[]) => arr.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    return (
        <Box sx={{ bgcolor: '#f5faff', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#003087', fontWeight: 600 }}>
                SOAP Notes
            </Typography>
            {soap_notes.map((note, index) => (
                <Accordion key={index} sx={{ mb: 2, bgcolor: 'white' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{note.note_type} (Template: {note.template_id || 'Default'})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography><strong>Subjective:</strong> {note.subjective}</Typography>
                        <Typography><strong>Objective:</strong> {note.objective}</Typography>
                        <Typography><strong>Assessment:</strong> {note.assessment}</Typography>
                        <Typography><strong>Plan:</strong> {note.plan}</Typography>
                        {note.discharge_summary && (
                            <Typography><strong>Discharge Summary:</strong> {note.discharge_summary}</Typography>
                        )}
                    </AccordionDetails>
                </Accordion>
            ))}

            <Typography variant="h6" gutterBottom sx={{ color: '#003087', fontWeight: 600 }}>
                Follow-Up Tasks
            </Typography>
            <Paper sx={{ mb: 2, bgcolor: 'white' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Assigned To</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTasks(follow_up_tasks).map((task, index) => (
                            <TableRow key={index}>
                                <TableCell>{task.description}</TableCell>
                                <TableCell>{task.due_date || 'N/A'}</TableCell>
                                <TableCell>{task.assigned_to || 'N/A'}</TableCell>
                                <TableCell>{task.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5]}
                    component="div"
                    count={data.follow_up_tasks.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                />
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ color: '#003087', fontWeight: 600 }}>
                Medication Instructions
            </Typography>
            <Paper sx={{ mb: 2, bgcolor: 'white' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Medication</TableCell>
                            <TableCell>Dosage</TableCell>
                            <TableCell>Frequency</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Route</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTasks(medication_instructions).map((med, index) => (
                            <TableRow key={index}>
                                <TableCell>{med.medication}</TableCell>
                                <TableCell>{med.dosage}</TableCell>
                                <TableCell>{med.frequency}</TableCell>
                                <TableCell>{med.duration || 'N/A'}</TableCell>
                                <TableCell>{med.route || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5]}
                    component="div"
                    count={data.medication_instructions.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                />
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ color: '#003087', fontWeight: 600 }}>
                Client Reminders
            </Typography>
            <Paper sx={{ mb: 2, bgcolor: 'white' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Category</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTasks(client_reminders).map((reminder, index) => (
                            <TableRow key={index}>
                                <TableCell>{reminder.description}</TableCell>
                                <TableCell>{reminder.priority}</TableCell>
                                <TableCell>{reminder.category}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5]}
                    component="div"
                    count={data.client_reminders.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                />
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ color: '#003087', fontWeight: 600 }}>
                Veterinarian To-Dos
            </Typography>
            <Paper sx={{ mb: 2, bgcolor: 'white' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTasks(vet_todos).map((todo, index) => (
                            <TableRow key={index}>
                                <TableCell>{todo.description}</TableCell>
                                <TableCell>{todo.due_date || 'N/A'}</TableCell>
                                <TableCell>{todo.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5]}
                    component="div"
                    count={data.vet_todos.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                />
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ color: '#003087', fontWeight: 600 }}>
                Warnings
            </Typography>
            <Paper sx={{ bgcolor: 'white' }}>
                <Table>
                    <TableBody>
                        {warnings.length ? (
                            warnings.map((warning, index) => (
                                <TableRow key={index}>
                                    <TableCell>{warning}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell>No warnings</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
};

export default TaskDisplay;