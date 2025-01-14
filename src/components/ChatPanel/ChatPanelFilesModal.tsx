import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemIcon, ListItemText, IconButton, Typography, Box, LinearProgress } from '@mui/material';
import { ApiClient } from '../../client';
import { Channel, FileDescription } from '../../types';
import { InsertDriveFile, Upload, Download } from '@mui/icons-material';

const FileDisplay = ({ file, client }: { file: FileDescription, client: ApiClient }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        console.log('Attempting to download file:', file);
        
        const fileId = file?.id;
        if (typeof fileId !== 'string' || !fileId) {
            console.error('No valid file ID available for download');
            return;
        }

        setIsDownloading(true);
        try {
            const blob = await client.downloadFile(fileId);
            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download file:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <ListItem
            secondaryAction={
                <IconButton 
                    edge="end" 
                    onClick={handleDownload}
                    disabled={isDownloading}
                >
                    <Download />
                </IconButton>
            }
        >
            <ListItemIcon>
                <InsertDriveFile />
            </ListItemIcon>
            <ListItemText 
                primary={file.filename}
                secondary={`Uploaded ${new Date(file.upload_timestamp).toLocaleDateString()}`}
            />
        </ListItem>
    );
};

export const ChatPanelFilesModal = ({ 
    client, 
    channel,
    onClose 
}: { 
    client: ApiClient, 
    channel: Channel,
    onClose: () => void 
}) => {
    const [files, setFiles] = useState<FileDescription[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await client.getAssociatedFiles(channel.id);
                console.log('Files response:', response);
                if (response.ok) {
                    setFiles(response.files);
                } else {
                    console.error('Failed to fetch files:', response.message);
                }
            } catch (error) {
                console.error('Error fetching files:', error);
            }
        };

        fetchFiles();
    }, [client, channel.id]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (!fileList?.length) return;

        setIsUploading(true);
        try {
            // Convert FileList to array and upload all files
            const uploadPromises = Array.from(fileList).map(file => 
                client.uploadFile(file, channel.id)
            );

            await Promise.all(uploadPromises);
            
            // Refresh the files list after all uploads complete
            const response = await client.getAssociatedFiles(channel.id);
            setFiles(response.files);
        } catch (error) {
            console.error('Failed to upload files:', error);
        } finally {
            setIsUploading(false);
            // Reset the input
            event.target.value = '';
        }
    };

    return (
        <Dialog 
            open={true}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            disableEnforceFocus
            disablePortal
            keepMounted
        >
            <DialogTitle>
                <Typography component="div">Channel Files</Typography>
            </DialogTitle>
            
            <DialogContent>
                {isUploading && <LinearProgress sx={{ mb: 2 }} />}
                
                <List>
                    {files.map((file, index) => (
                        <FileDisplay 
                            key={file.id || `file-${index}`} 
                            file={file}
                            client={client}
                        />
                    ))}
                    {files.length === 0 && (
                        <ListItem>
                            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center', width: '100%' }}>
                                No files uploaded yet
                            </Typography>
                        </ListItem>
                    )}
                </List>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Box sx={{ position: 'relative', flex: 1 }}>
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<Upload />}
                        disabled={isUploading}
                    >
                        Upload Files
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".txt,.md,.pdf"
                            multiple
                            hidden
                        />
                    </Button>
                </Box>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}


