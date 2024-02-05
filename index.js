const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const client = new Client();
const currentTime = Date.now();

const messageTracker = new Map();
const levelTracker = new Map();
const spamTracker = new Map();
const warningTracker = new Map();
const reportTracker = new Map();
const badWords = ['nigga', 'NIGGA', 'NiGgA', 'niemand mag dich', 'huan', 'verpiss dich', 'hurensohn', 'Hurensohn', 'hzm', 'hZm', 'Hzm', 'HZM', 'hzM', 'HUAN', 'HuAn', 'hUaN', 'huAN', 'HUan', 'Arschloch', 'ARSCHLOCH', 'arschloch', 'arsch', 'ARSCH', 'Arsch', 'nega', 'NEGA', 'NeGa', 'nEgA', 'deine Mutter', 'deine Mum', 'deine Mutter', 'niger', 'suka', 'hs', 'HS', 'Hs', 'hS', 'sH', 'Sh', 'HS', 'https://', 'www.'];
const reportGroupId = '120363221188996603@g.us';
let bewerbungenOffen = false; // Bewerbungen sind standardmäßig geschlossen

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (message) => {
    // Überprüfe, ob die Nachricht vom Bot selbst stammt oder kein Autor vorhanden ist
    if (message.fromMe || !message.author) {
;
    }


    const cleanedMessage = filterBadWords(message.body);
    if (cleanedMessage !== message.body) {

        await client.sendMessage(message.from, cleanedMessage);
        await message.reply('Einige Teile deiner Nachricht wurden entfernt, da sie unerwünschte Wörter enthielten.');
        await message.delete();
    }

   
    
    const userId = message.author.id;
    if (spamTracker.has(userId)) {
        const userData = spamTracker.get(userId);
        const currentTime = Date.now();

       
        if (currentTime - userData.timestamp < 4000) {
           
            userData.counter += 1;

           
            if (userData.counter >= 5) {
                // Warnung hinzufügen
                addWarning(userId);

                // Überprüfe, ob der Benutzer 5 Warnungen erreicht hat
                if (getWarningCount(userId) >= 5) {
                    // Hier muss die eigentliche Logik für das Kicken implementiert werden
                    await message.reply('Du wurdest verwarnt. Das Admin Team kann deine Warnungen sehen und entscheiden, ob du gewarnt oder gekickt wirst.');
                    // Zum Beispiel: client.removeParticipant(message.from, userId);
                } else {
                    // Lösche die einzelne Nachricht des Benutzers für alle (Hier muss die eigentliche Löschlogik implementiert werden)
                    if (client && typeof client.deleteMessage === 'function') {
                        await client.deleteMessage(message.from, message.id);
                    } else {
                        console.error("deleteMessage method not found in the client object");
                    }
                }
            }
        } else {
            // Zurücksetzen des Zählers und Zeitstempels, da die Zeitdifferenz größer als 4 Sekunden ist
            userData.counter = 1;
            userData.timestamp = currentTime;
        }
    } else {
        // Hinzufügen des Benutzers zum Spam-Tracker
        spamTracker.set(userId, { counter: 1, timestamp: currentTime });
    }

    // Befehl: !ping
    if (message.body === '!ping') {
        await message.reply('Pong!');
    }

    // Befehl: !infos
    if (message.body === '!infos') {
        await message.reply('Ersteller: Damian  Erstelldatum 22.01.24  Running auf Node.js');
    }

    // Befehl: !help
    if (message.body === '!help') {
        await message.reply(
            'Verfügbare Befehle:\n' +
            '!help - Diese Hilfemeldung anzeigen\n' +
            '!uptime - Zeigt den Uptime des Botes an\n' +
            '!ping - Bot antwortet mit Pong!\n' +
            '!warn-infos - Zeigt dir Infos über die Warns z.B. Wann man gekickt wird\n' +
            '!show-warns - Zeigt die deine Anzahl von Warns an\n' +
            '!pläne - Zeigt dir die Planungen für die Updates an\n' +
            '!report - Melde einen Nutzer aus der Gruppe\n' +
            'ADMINBEFEHLE\n' +
            '!kick - [Benutzernummer] - Benutzer kicken\n' +
            '!infos - Informationen zum Bot\n' +
            '!warn - [Benutzernummer] - Benutzer verwarnen\n' +
            '!show-warn - Zeigt die Anzahl der Warnungen an\n' +
            '!warn-infos - Infos zu den Warnungen\n' +
            'Anti-Spam System ist automatisch angeschaltet\n' +
            'Das Beleidigungs System ist automatisch angeschaltet'

        );
    }

    if (message.body === '!uptime') {
        // Implementiere die Logik für den Uptime-Befehl
        // Zum Beispiel: 
        const uptime = calculateUptime(); // Funktion, die die Uptime berechnet
        await message.reply(`Uptime des Bots: ${uptime}`);
    }
    
    if (message.body.startsWith('!kick')) {
        // Überprüfe, ob der Absender die Berechtigung zum Kicken hat
        if (message.author.isAdmin) {  // Hier musst du die Logik für die Überprüfung der Administratorrechte implementieren
            // Extrahiere die Zielnummer aus der Nachricht
            const targetNumber = message.body.split(' ')[1];
            
            // Führe den Kick durch (Hier muss die eigentliche Logik für das Kicken implementiert werden)
            await message.reply(`User ${targetNumber} wurde gekickt.`);
        } else {
            await message.reply('Du hast nicht die Berechtigung, diesen Befehl auszuführen.');
        }
    }

    if (message.body.startsWith('!warn')) {
        // Überprüfe, ob der Absender die Berechtigung zum Verwarnen hat
        if (message.author.isAdmin) {  // Hier musst du die Logik für die Überprüfung der Administratorrechte implementieren
            // Extrahiere die Zielnummer aus der Nachricht
            const targetNumber = message.body.split(' ')[1];
            
            // Führe die Verwarnung durch
            warnUser(targetNumber, message.author.id);

            // Hier kannst du eine Bestätigungsnachricht senden
            await message.reply(`User ${targetNumber} wurde verwarnt.`);
        } else {
            await message.reply('Du hast nicht die Berechtigung, diesen Befehl auszuführen.');
        }
    }

    if (message.body.startsWith('!report')) {
        const args = message.body.split(' ');
        if (args.length >= 3) {
            const targetNumber = args[1];
            const reason = args.slice(2).join(' ');

            // Meldung in andere Gruppe senden
            const reportMessage = `Benutzer ${targetNumber} wurde gemeldet. Grund: ${reason}`;
            sendReportToGroup(reportMessage);

            // Bestätigungsnachricht senden
            await message.reply(`Du hast erfolgreich den Benutzer ${targetNumber} gemeldet. Danke für deine Meldung.`);
        } else {
            // Ungültige Befehlssyntax
            await message.reply('Ungültige Befehlssyntax. Verwende `!report (Der gepingte Nutzer) (Grund des Reports)`.');
        }
    }

    // Befehl: !show-warns
    if (message.body === '!show-warns') {
        // Überprüfe, ob der Absender die Berechtigung hat, Warnungen anzuzeigen
        if (message.author.isAdmin) {
            // Rufe die Anzahl der Warnungen für den Absender ab
            const warningCount = getWarningCount(message.author.id);

            // Sende die Anzahl der Warnungen als Antwort
            await message.reply(`Du hast ${warningCount} Warnungen.`);
        } else {
            await message.reply('Du hast nicht die Berechtigung, diesen Befehl auszuführen.');
        }
    }

    if (message.body === '!warn-infos') {
        await message.reply('Wenn man insgesamt 5 Warns hat, wird man aus der Gruppe gekickt. Wenn es ein Test war oder Fehlalarm kann ein Admin mit dem !remove-warn [Nutzer] Befehl den Warn löschen.');
    }

    if (message.body === '!pläne') {
        await message.reply(
            'Planungen mit Status:\n' + 
            'Auto Moderation  |  Verbesserungen laufen:\n' +
            'Bewerbungs Befehle | In der BETA Phase\n' +
            'Meme Befehle     |  Vielleicht:\n' +
            'Witz Befehle     |  Vielleicht:\n' +
            'Es kommen mehr Befehle\n' +
            'LG Entwickler Team'

        );
    }

    if (message.body === '!groupinfo') {
        const groupInfo = `Gruppen-ID: ${message.from}`;
        await message.reply(groupInfo);
    }

    if (message.body === '!bewerben') {
        if (bewerbungenOffen) {
            if (reportTracker.has(userId) && reportTracker.get(userId).bewerbungSent) {
                await message.reply('Du hast bereits eine Bewerbung gesendet. Bitte warte auf eine Antwort.');
            } else {
                if (message.body.length < 200) {
                    await message.reply('Deine Bewerbung muss mindestens 200 Zeichen enthalten.');
                } else {
                    const bewerbungMessage = `Bewerbung von Benutzer ${userId}:\n${message.body}`;
                    const targetGroupId = '120363221188996603@g.us'; // Ersetze dies durch die tatsächliche Gruppen-ID
                    sendReportToGroup(targetGroupId, bewerbungMessage);

                    if (reportTracker.has(userId)) {
                        reportTracker.get(userId).bewerbungSent = true;
                    } else {
                        reportTracker.set(userId, { bewerbungSent: true });
                    }

                    await message.reply('Vielen Dank für deine Bewerbung! Wir werden uns in Kürze bei dir melden.');
                }
            }
        } else {
            await message.reply('Bewerbungen sind derzeit geschlossen. Bitte warte auf eine Ankündigung zur Wiedereröffnung.');
        }
    }

    // Befehl: !open-bewerbungen
    if (message.body === '!open-bewerbungen') {
        if (message.author.isAdmin) {
            bewerbungenOffen = true;
            await message.reply('Bewerbungen sind jetzt geöffnet.');
        } else {
            await message.reply('Du hast nicht die Berechtigung, diesen Befehl auszuführen.');
        }
    }

    // Befehl: !close-bewerbungen
    if (message.body === '!close-bewerbungen') {
        if (message.author.isAdmin) {
            bewerbungenOffen = false;
            await message.reply('Bewerbungen sind jetzt geschlossen.');
        } else {
            await message.reply('Du hast nicht die Berechtigung, diesen Befehl auszuführen.');
        }
    }

    if (message.body === '!lb') {
        const totalMessages = getTotalMessageCount(leaderstats.chatter);
        const topChatters = getTopUsers(leaderstats.chatter);
    
        const leaderboardMessage = `
    Top Vielschreiber:
    ${formatTopUsers(totalMessages, topChatters)}
    `;
    
        await message.reply(leaderboardMessage);
      }

      if (!levelTracker.has(userId)) {
        levelTracker.set(userId, { level: 1, messageCount: 0 });
      }
    
      const userData = levelTracker.get(userId);
    
      // Erhöhe das Level und den Nachrichtenzähler für jede empfangene Nachricht
      userData.messageCount += 1;
    
      // Überprüfe, ob der Benutzer 90 Nachrichten erreicht hat
      if (userData.messageCount === 90) {
        userData.level += 1;
        userData.messageCount = 0; // Zurücksetzen des Zählers nach einem Level-Up
    
        // Erfolgsmeldung mit Bild-URL
        const successMessage = `
    🎉 Herzlichen Glückwunsch! Du hast Level ${userData.level} erreicht! 🎉
    
    Schau dir dein Level-Up-Bild an:
    https://ibb.co/N9LzsgN
        `;
    
        await message.reply(successMessage);
      }
    
      // Befehl: !level
      if (message.body === '!level') {
        await message.reply(`Dein aktuelles Level: ${userData.level}`);
      }

      if (!messageTracker.has(userId)) {
        messageTracker.set(userId, 0);
      }
    
      messageTracker.set(userId, messageTracker.get(userId) + 1)
    
      // Befehl: !messages
      if (message.body === '!messages') {
        const userMessages = messageTracker.get(userId);
        message.reply(`Du hast insgesamt ${userMessages} Nachrichten gesendet.`);
      }

});

async function sendReportToGroup(reportMessage) {
    try {
        // Hier sendest du die Meldung an die Ziel-Gruppe
        await client.sendMessage(reportGroupId, reportMessage);
    } catch (error) {
        console.error('Fehler beim Senden der Meldung in die Gruppe:', error);
    }
}

async function sendReportToGroup(groupId, reportMessage) {
    try {
        console.log(`Sending report to group ${groupId}`);
        await client.sendMessage(groupId, reportMessage);
        console.log(`Report successfully sent to group ${groupId}`);
    } catch (error) {
        console.error('Error sending report message to group:', error);
    }
}


// Funktion zum Filtern von beleidigenden Wörtern
function filterBadWords(originalMessage) {
    let filteredMessage = originalMessage;
    badWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredMessage = filteredMessage.replace(regex, '***');
    });
    return filteredMessage;
}

// Funktion zum Hinzufügen einer Warnung für einen Benutzer
function addWarning(userId) {
    if (warningTracker.has(userId)) {
        warningTracker.set(userId, warningTracker.get(userId) + 1);
    } else {
        warningTracker.set(userId, 1);
    }
}

// Funktion zum Abrufen der Anzahl der Warnungen für einen Benutzer
function getWarningCount(userId) {
    return warningTracker.get(userId) || 0;
}

// Funktion zur Berechnung der Uptime
function calculateUptime() {
    const uptimeMilliseconds = Date.now() - client.info.me.session - client.info.me._serialized.slice(0, -14);
    const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    return `${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
}

// Funktion zum Verwarnen eines Benutzers
function warnUser(targetUserId, adminUserId) {
    // Hier implementierst du die Logik für die Verwarnung
    // Du könntest zum Beispiel die Anzahl der Warnungen in einer Datenbank speichern
    // und die Aktionen basierend auf der Anzahl der Warnungen durchführen
    console.log(`User ${targetUserId} wurde von Admin ${adminUserId} verwarnt.`);
}

function getTotalMessageCount(statMap) {
    return Array.from(statMap.values()).reduce((total, count) => total + count, 0);
  }
  
  function formatTopUsers(totalMessages, topUsers) {
    return topUsers.map(([userId, messageCount], index) => {
      const percentage = ((messageCount / totalMessages) * 100).toFixed(2);
      return `${index + 1}. User ${userId}: ${messageCount} Nachrichten (${percentage}% der Gesamtnachrichten)`;
    }).join('\n');
  }

client.initialize();
