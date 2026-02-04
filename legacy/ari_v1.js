client.connect(ARI_URL, ARI_USER, ARI_PASS)
    .then(ari => {
        console.log('Connected to Asterisk ARI');
        ari.start(APP_NAME);

        ari.on('StasisStart', async (event, channel) => {
            const args = event.args;
            const dept = args[0] || 'general';
            const issueType = args[1] || 'unknown';

            console.log(`Stasis started: ${channel.id} Dept: ${dept}, Issue: ${issueType}`);

            // Log call start to DB
            const callDbId = await db.logCall(event.channel.caller.number);

            await channel.answer();

            // Record the complaint
            await recordComplaint(ari, channel, callDbId, issueType);
        });

        ari.on('StasisEnd', async (event, channel) => {
            console.log(`Call ended: ${channel.id}`);
        });

        async function recordComplaint(ari, channel, callDbId, issueType) {
            const recordingName = `complaint-${callDbId}-${Date.now()}`;
            const format = 'wav';

            // Play beep before recording
            // We assume standard beep exists, or we use a silent short file if missing
            try {
                await channel.play({ media: 'sound:beep' });
            } catch (e) {
                console.log('Beep sound not found, proceeding to record');
            }

            const recording = ari.LiveRecording();

            // Start recording
            await channel.record({
                name: recordingName,
                format: format,
                maxDurationSeconds: 120,
                maxSilenceSeconds: 5,
                ifExists: 'overwrite',
                beep: false, // We played it manually
                terminateOn: '#'
            });

            // Handle recording finished
            ari.once('RecordingFinished', async (event, recordingObj) => {
                if (recordingObj.name !== recordingName) return;

                console.log(`Recording finished: ${recordingName}`);

                // Assuming default Asterisk recording path. 
                // In production, configure asterisk.conf or use absolute paths if allowed.
                // For this setup, we try to locate it in standard spool or project audio dir if we configured it.
                // Since we didn't change asterisk.conf, it's in /var/spool/asterisk/recording/
                const recordingPath = `/var/spool/asterisk/recording/${recordingName}.${format}`;

                // Upload to Freshdesk
                const ticketId = await freshdesk.createTicketWithRecording(recordingPath, channel.caller.number);

                // Update DB
                await db.updateCallStatus(callDbId, 'IVR_COMPLAINT', null, recordingObj.duration, recordingPath);

                if (ticketId) {
                    await db.logTicket(ticketId, callDbId, issueType);

                    // Play "Ticket Created"
                    try {
                        await channel.play({ media: 'sound:audio/valoro-ticket-created' });
                    } catch (e) {
                        console.log('Ticket created sound missing');
                    }

                } else {
                    // Play generic error if ticket failed (optional)
                    console.log("Failed to create ticket");
                }

                // Play Goodbye
                try {
                    await channel.play({ media: 'sound:audio/valoro-goodbye' });
                } catch (e) { }

                // Hangup and exit Stasis to let Dialplan continue or end
                // extensions.conf has 'Hangup()' after Stasis, but we can do it here too.
                channel.continueInDialplan();
            });
        }
    })
    .catch(err => console.error('Error connecting to ARI', err));