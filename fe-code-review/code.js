/* Comment: do not see good error handling through all file, no error handling in async operations */
/* Comment: added if/else brackets to code readability */
/* Comment: not sure if logDebug and logInfo print all the necessary info about the file where it happened and what problem had occurred and should be removed if this is debugging info*/
app.post('/api/extract', upload.single('file'), async (req, res) => {
    logInfo('POST /api/extract',req.body);
    logInfo('FILE=',req.file);

    if (req.body) {
        const file = req.file;
        /* Comment: choose one consistent way how to name ids: nameID or idName or nameId */
        const requestID = req.body.requestID;
        const project = req.body.project;
        const idUser = req.body.userID;
        const user = await User.findOne(idUser);

        /* Comment: if user is exist do not need to check userID, or need to be moved user declaration inside if */
        if (requestID && project && idUser && user) {
            /* Comment: requested changes: logDebug(`User with role ${user.role}`, user); */
            logDebug('User with role '+user.role, user);
            if (user.role === 'ADVISOR' || user.role.indexOf('ADVISOR') > -1)
                /* Comment: not sure why we use DONE here, it is not consistent with other code statuses */
                return res.json({requestID, step: 999, status: 'DONE', message: 'Nothing to do for ADVISOR role'});

            /* Comment: single-line comment for code consistency */
            /* reset status variables */
            await db.updateStatus(requestID, 1, '');

            logDebug('CONFIG:', config.projects);
            if (project === 'inkasso' && config.projects.hasOwnProperty(project) && file) {
                /* Comment: unused variable */
                const hashSum = crypto.createHash('sha256');
                const fileHash = idUser;
                const fileName = 'fullmakt';
                const fileType = mime.getExtension(file.mimetype);
                if (fileType !== 'pdf')
                    return res.status(500).json({requestID, message: 'Missing pdf file'}); /* Comment: requested changes: File has incorrect type/ File is not pdf */
                await db.updateStatus(requestID, 3, '');

                const folder = `${project}-signed/${idUser}`;
                logDebug('FILE2=', file);
                await uploadToGCSExact(folder, fileHash, fileName, fileType, file.mimetype, file.buffer);
                await db.updateStatus(requestID, 4, '');
                /* Comment: change the name to a better one, not 'ret'  */
                const ret = await db.updateUploadedDocs(idUser, requestID, fileName, fileType, file.buffer);
                logDebug('DB UPLOAD:', ret);

                await db.updateStatus(requestID, 5, '');

                /* Comment: unused variable */
                let sent = true;
                const debtCollectors = await db.getDebtCollectors();
                logDebug('debtCollectors=', debtCollectors);
                if (!debtCollectors)
                    return res.status(500).json({requestID, message: 'Failed to get debt collectors'});

                /* Comment: suggestion for more readable code, move await in a separate variable */
                if (!!(await db.hasUserRequestKey(idUser))) { //FIX: check age, not only if there's a request or not /* Comment: change 'Fix' for 'TODO' and create bug ticker for that */
                 /* Comment: not sure why we use DONE here, it not consistent with other code statuses */
                    return res.json({requestID, step: 999, status: 'DONE', message: 'Emails already sent'});
                }

                const sentStatus = {};
                /* Comment: adding time-consuming operations to a loop is a very bad idea, if we have a lot of debtCollectors request will be just crushed  */
                for (let i = 0; i < debtCollectors.length ; i++) {
                    /* Comment: requested changes: i+10 */
                    await db.updateStatus(requestID, 10+i, '');
                    const idCollector = debtCollectors[i].id;
                    const collectorName = debtCollectors[i].name;
                    const collectorEmail = debtCollectors[i].email;
                    const hashSum = crypto.createHash('sha256');
                     {/* Comment: removed unused brackets
                    requested changes: 
                        const hashInput = `${idUser}-${idCollector}-${new Date().toISOString()}`;
                    */}
                    const hashInput = `${idUser}-${idCollector}-${(new Date()).toISOString()}`;
                    logDebug('hashInput=', hashInput);
                    hashSum.update(hashInput);
                    const requestKey = hashSum.digest('hex');
                    logDebug('REQUEST KEY:', requestKey);

                    /* Comment: add semicolon and 'utf-8' can be removed - it is default value */
                    const hash = Buffer.from(`${idUser}__${idCollector}`, 'utf8').toString('base64')

                    /* Comment: suggestion for more readable code, move await in a separate variable */
                    if (!!(await db.setUserRequestKey(requestKey, idUser))
                        && !!(await db.setUserCollectorRequestKey(requestKey, idUser, idCollector))) {

                        /* Comment: single-line comment for code consistency */
                        /* prepare email */
                        const sendConfig = {
                            sender: config.projects[project].email.sender,
                            replyTo: config.projects[project].email.replyTo,
                            /* Comment: string quote need to be closed, is it correct email subject? */
                            subject: 'Email subject,
                            templateId: config.projects[project].email.template.collector,
                            params: {
                                downloadUrl: `https://url.go/download?requestKey=${requestKey}&hash=${hash}`,
                                uploadUrl: `https://url.go/upload?requestKey=${requestKey}&hash=${hash}`,
                                confirmUrl: `https://url.go/confirm?requestKey=${requestKey}&hash=${hash}`
                            },
                            tags: ['request'],
                            to: [{ email: collectorEmail , name: collectorName }],
                        };
                        logDebug('Send config:', sendConfig);

                        try {
                            /* Comment: add semicolon */
                            await db.setEmailLog({collectorEmail, idCollector, idUser, requestKey})
                        } catch (e) {
                            logDebug('extract() setEmailLog error=', e);
                        }

                        /* send email */
                        const resp = await email.send(sendConfig, config.projects[project].email.apiKey);
                        logDebug('extract() resp=', resp);

                        // update DB with result
                        await db.setUserCollectorRequestKeyRes(requestKey, idUser, idCollector, resp);

                        if (!sentStatus[collectorName])
                            sentStatus[collectorName] = {};
                        sentStatus[collectorName][collectorEmail] = resp;
                        /* Comment: check is there is response before we assign it, on the 118 line */

                        if (!resp) {
                            logError('extract() Sending email failed: ', resp);
                        }
                    }
                }
                await db.updateStatus(requestID, 100, '');

                logDebug('FINAL SENT STATUS:');
                console.dir(sentStatus, {depth: null});

                /* Comment: delete it if it is not necessary */
                //if (!allSent)
                //return res.status(500).json({requestID, message: 'Failed sending email'});

                await db.updateStatus(requestID, 500, '');

                /* Comment: single-line comment for code consistency */
                /* prepare summary email */
                const summaryConfig = {
                    /* Comment: remove or add explanation why this area is commented */
                    //bcc: [{ email: 'tomas@inkassoregisteret.com', name: 'Tomas' }],
                    /* Comment: we use these sender and replyTo variables several times in this function, so we can separate them into separate variables  */
                    sender: config.projects[project].email.sender,
                    replyTo: config.projects[project].email.replyTo,
                    subject: 'Oppsummering Kravsforespørsel',
                    templateId: config.projects[project].email.template.summary,
                    params: {
                        collectors: sentStatus,
                    },
                    tags: ['summary'],
                    /* Comment: change 'Fix' for 'TODO' and create bug ticker for that */
                    to: [{ email: 'tomas@upscore.no' , name: 'Tomas' }], // FIXXX: config.projects[project].email.sender
                };
                logDebug('Summary config:', summaryConfig);

                /* Comment: remove or add explanation why this area is commented */
                /* send email */
                //const respSummary = await email.send(sendConfig, config.projects[project].email.apiKey);
                //logDebug('extract() summary resp=', respSummary);

                await db.updateStatus(requestID, 900, '');
            }
            await db.updateStatus(requestID, 999, '');
            /* Comment: not sure why we use DONE here, it not consistent with other code statuses */
            return res.json({requestID, step: 999, status: 'DONE', message: 'Done sending emails...'});
        } else
            /* Comment: we do not check here if the file is missing */
            return res.status(500).json({requestID, message: 'Missing requried input (requestID, project, file)'});
    }
    res.status(500).json({requestID: '', message: 'Missing requried input (form data)'});
});