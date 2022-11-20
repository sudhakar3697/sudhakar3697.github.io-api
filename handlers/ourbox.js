const express = require('express');
const router = express.Router();
// const EventEmitter = require('events');
const multer = require('multer');
const firebase = require('./firebase');
global.XMLHttpRequest = require('xhr2');
require('firebase/auth');
require('firebase/storage');

const upload = multer();
const uploadTasks = new Map();
// const uploadEventsStream = new EventEmitter();

const storage = firebase.storage();
const storageRef = storage.ref();

// Get List of files in the root
router.get('/', async (req, res) => {
    try {
        res.send(await listFilesInRoot());
    } catch (err) {
        res.status(404).send(err);
    }
});

// Upload files to root
router.post('/', upload.fields([{ name: 'files-to-upload', maxCount: 4 }]), async (req, res) => {
    try {
        const errors = [];
        const tasks = [];
        for (const file of req.files['files-to-upload']) {
            try {
                const fileSize = file.size / (1024 * 1024);
                if (fileSize > 250) {
                    errors.push({ name: file.originalname, error: 'File should be less than 250 MB' });
                }
                else {
                    tasks.push({ name: file.originalname, status: 'started' });
                    if (!uploadTasks.has(file.originalname)) {
                        console.log('Task has been added to uploadTasks Map');
                        uploadTasks.set(file.originalname, null);
                        printUploadTasksMap('uploadItem-init-1');
                    }
                    else {
                        console.log('Already present in uploadTasks Map');
                        printUploadTasksMap('uploadItem-init-2');
                    }
                    uploadItem(file.originalname, file.buffer);
                }
            } catch (err) {
                errors.push({ name: file.originalname, error: err });
            }
        }
        res.send({
            tasks,
            errors
        });
    } catch (err) {
        console.log(err);
        res.status(404).send(err);
    }
});

// Get download URL for the requested file
router.post('/download', async (req, res) => {
    try {
        res.send(await downloadItem(req.body.path));
    } catch (err) {
        res.status(404).send(err.message);
    }
});

// Delete the requested file
router.delete('/', async (req, res) => {
    try {
        res.send(await deleteItem(req.body.path));
    } catch (err) {
        res.status(404).send(err.message);
    }
});

// Perform pause, resume, cancel operations on upload tasks
router.post('/uploads', async (req, res) => {
    try {
        switch (req.body.operation) {
            case 'cancel':
                uploadTasks.get(req.body.file).cancel();
                uploadTasks.delete(req.body.file);
                res.send('Cancelled');
                break;
            case 'pause-or-resume':
                const snapshot = uploadTasks.get(req.body.file).snapshot;
                if (snapshot.state === firebase.storage.TaskState.PAUSED) {
                    uploadTasks.get(req.body.file).resume();
                    res.send('Resumed');
                }
                else if (snapshot.state === firebase.storage.TaskState.RUNNING) {
                    uploadTasks.get(req.body.file).pause();
                    res.send('Paused');
                }
                else {
                    res.send('Invalid upload task state found');
                }
                break;
            default:
                res.send('Invalid operation');
                break;
        }
    } catch (err) {
        res.status(404).send(err.message);
    }
});

// Get list of upload tasks
router.get('/uploads', async (req, res) => {
    try {
        const data = [];
        printUploadTasksMap('/api/uploads');
        for (const task of uploadTasks) {
            const task2 = task[1] || {};
            const { bytesTransferred, totalBytes, state } = task2.snapshot || {};
            data.push({
                file: task[0],
                bytesTransferred: `${(bytesTransferred / (1024 * 1024)).toFixed(2)} MB`,
                totalBytes: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
                progress: ((bytesTransferred / totalBytes) * 100).toFixed(2),
                state
            });
        }
        res.send(data);
    } catch (err) {
        console.log(err);
        res.status(404).send(err);
    }
});

// router.get('/uploads/events', (req, res) => sendUploadEvents(req, res));

async function listFilesInRoot() {
    try {
        const data = [];
        const result = await storageRef.listAll();
        // get folders result.prefixes
        for await (const entry of result.items) {
            const { fullPath, size, updated } = await entry.getMetadata();
            data.push({ fullPath, size, updated });
        }
        return data;
    } catch (err) {
        throw err;
    }
}

async function downloadItem(path) {
    try {
        return await storageRef.child(path).getDownloadURL();
    } catch (err) {
        throw err;
    }
}

async function deleteItem(path) {
    try {
        return await storageRef.child(path).delete();
    } catch (err) {
        throw err;
    }
}

async function uploadItem(fileName, file) {
    const uploadTask = storageRef.child(fileName).put(file);
    // uploadEventsStream.emit('start', {
    //     bytesTransferred: `${(uploadTask.snapshot.bytesTransferred / (1024 * 1024)).toFixed(2)} MB`,
    //     totalBytes: `${(uploadTask.snapshot.totalBytes / (1024 * 1024)).toFixed(2)} MB`,
    //     progress: ((uploadTask.snapshot.bytesTransferred / uploadTask.snapshot.totalBytes) * 100).toFixed(2),
    //     file: fileName,
    //     state: uploadTask.snapshot.state
    // });
    printUploadTasksMap('uploadItem1');
    uploadTasks.set(fileName, uploadTask);
    printUploadTasksMap('uploadItem2');
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, (snapshot) => {
        // uploadEventsStream.emit('progress', {
        //     bytesTransferred: `${(uploadTask.snapshot.bytesTransferred / (1024 * 1024)).toFixed(2)} MB`,
        //     totalBytes: `${(uploadTask.snapshot.totalBytes / (1024 * 1024)).toFixed(2)} MB`,
        //     progress: ((uploadTask.snapshot.bytesTransferred / uploadTask.snapshot.totalBytes) * 100).toFixed(2),
        //     file: fileName,
        //     state: uploadTask.snapshot.state
        // });
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED:
                console.log('Upload is paused');
                break;
            case firebase.storage.TaskState.RUNNING:
                console.log('Upload is running');
                break;
        }
    }, (error) => {
        console.log(error.code);
        // uploadEventsStream.emit('error', {
        //     bytesTransferred: `${(uploadTask.snapshot.bytesTransferred / (1024 * 1024)).toFixed(2)} MB`,
        //     totalBytes: `${(uploadTask.snapshot.totalBytes / (1024 * 1024)).toFixed(2)} MB`,
        //     progress: ((uploadTask.snapshot.bytesTransferred / uploadTask.snapshot.totalBytes) * 100).toFixed(2),
        //     file: fileName,
        //     state: uploadTask.snapshot.state
        // });
        printUploadTasksMap('uploadItem4');
    }, () => {
        // uploadEventsStream.emit('complete', {
        //     bytesTransferred: `${(uploadTask.snapshot.bytesTransferred / (1024 * 1024)).toFixed(2)} MB`,
        //     totalBytes: `${(uploadTask.snapshot.totalBytes / (1024 * 1024)).toFixed(2)} MB`,
        //     progress: ((uploadTask.snapshot.bytesTransferred / uploadTask.snapshot.totalBytes) * 100).toFixed(2),
        //     file: fileName,
        //     state: uploadTask.snapshot.state
        // });
        printUploadTasksMap('uploadItem5');
        uploadTasks.delete(fileName);
    });
}

// function sendUploadEvents(req, res) {

//     res.writeHead(200, {
//         'Content-Type': 'text/event-stream',
//         'Cache-Control': 'no-cache',
//         Connection: 'keep-alive'
//     });

//     setTimeout(() => {
//         res.write(`data: ${JSON.stringify({
//             status: 'OK'
//         })}\n\n`);
//         res.flush();
//     }, 25000);

//     setInterval(() => {
//         res.write(`data: ${JSON.stringify({
//             status: 'OK'
//         })}\n\n`);
//         res.flush();
//     }, 50000);

//     uploadEventsStream.on('start', function (data) {
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//         res.flush();
//     });

//     uploadEventsStream.on('progress', function (data) {
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//         res.flush();
//     });

//     uploadEventsStream.on('error', function (data) {
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//         res.flush();
//     });

//     uploadEventsStream.on('complete', function (data) {
//         res.write(`data: ${JSON.stringify(data)}\n\n`);
//         res.flush();
//     });
// }

function printUploadTasksMap(name = '') {
    console.log(`start - printUploadTasksMap - ${name}`);
    for (const task of uploadTasks) {
        console.log(task[0], 'is present in Map!!');
    }
    console.log(`end - printUploadTasksMap - ${name}`);
}

module.exports = router;
