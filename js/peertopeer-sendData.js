$(function() {
    'use strict';


    apiRTC.setLogLevel(10);


    // =========================================================
    // CONFIGURATION
    // =========================================================
    // 'myDemoApiKey' est la clé de démonstration PUBLIQUE fournie par Apizee
    // dans tous leurs exemples officiels (voir github.com/ApiRTC/reactNativeApiRTC :
    // "For this demo we use the ApiKey 'myDemoApiKey'. Please register on our
    // website to get your own private ApiKey"). Elle fonctionne telle quelle
    // pour tester, mais est partagée par tout le monde.
    //
    // Pour utiliser VOTRE PROPRE clé : remplacez la ligne ci-dessous.
    // Attention : la clé de votre tenant Apizee Cloud (visible dans le JSON
    // "apiRtcKey" du dashboard Apizee Cloud) n'est PAS forcément la même chose
    // que la clé "Enterprise" ApiRTC attendue ici. Si l'enregistrement échoue
    // avec votre clé, récupérez la bonne clé sur https://dashboard.apirtc.com
    // (section API Keys de votre compte développeur ApiRTC), pas sur Apizee Cloud.
    var API_KEY = 'myDemoApiKey';

    var cloudUrl = 'https://cloud.apizee.com';
    var connectedSession = null;
    var activeContact = null;
    var activeChats = {};

    function showDataBox() {
        document.getElementById('data').style.display = 'block';
    }

    //Wrapper to send a message to a contact and display sent message in UI
    function sendMessageToActiveContact(message) {
        if (message !== '') {

            //Actually send message to active contact
            activeContact.sendData(message)
                .then(function() {
                    //Message successfully sent!

                    console.error("message send");

                    $('#typing-area').val('');
                    var messageLine = '<li><b>Me</b> : ' + message + '</li>';
                    $('#message-list').append(messageLine);
                    activeChats[activeContact.getId()].push(messageLine); //save message
                })
                .catch(function(err) {
                    //An error occured...
                    $('#message-list').append('<li><i>* Could not send message to contact :' + (err && err.error ? err.error.message : err) +  ' *</i></li>');
                });
        }
    }

    //Select active contact for databox UI
    function setActiveContact(contactId) {
        if (activeContact === null) {
            // Show databox
            showDataBox();
        }
        //==============================
        // GET CONTACT OBJECT
        //==============================
        activeContact = connectedSession.getOrCreateContact(contactId);
        //Restore previous data messsages
        $('#message-list').empty();
        for (var i = 0; i < activeChats[activeContact.getId()].length; i++) {
            $('#message-list').append(activeChats[activeContact.getId()][i]);
        }
        document.getElementById('active-contact-id').innerHTML = activeContact.getId();
    }

    //Initialize data history for contact if needed
    function addContactToActiveDataBox(contactId) {

        if (!activeChats.hasOwnProperty(contactId)) {
            activeChats[contactId] = [];
            var contactLabel = $('<li />', {
                text: contactId,
                class: 'active-data'
            });
            contactLabel.on('click', function(e) {
                setActiveContact(contactId);
            });
            $('#active-datas').append(contactLabel);
        }
    }

    //==============================
    // CREATE USER AGENT
    //==============================
    var ua = new apiRTC.UserAgent({
        uri: 'apzkey:' + API_KEY
    });

    //==============================
    // REGISTER
    //==============================
    ua.register({
        cloudUrl: cloudUrl
    }).then(function(session) {
        // Save session
        connectedSession = session;

        // Display user number
        document.getElementById('my-number').innerHTML = connectedSession.getId();

        //==============================
        // WHEN CHAT MESSAGE IS  RECEIVED
        //==============================

        //Listen to contact message events globally
        connectedSession.on('contactData', function(e) {
            //Save contact to contact list
            addContactToActiveDataBox(e.sender.getId());
            if (activeContact === null) {
                setActiveContact(e.sender.getId());
            }
            var messageLine = '<li><b>' + e.sender.getId() + '</b> : ' + e.content + '</li>';
            activeChats[e.sender.getId()].push(messageLine); //save message
            //Display message in UI
            if (e.sender === activeContact) {
                $('#message-list').append(messageLine);
            }
        });

    }).catch(function(error) {
        // error
        console.error('User agent registering failed', error);
        alert('Registration failed: ' + (error && error.error ? error.error.message : JSON.stringify(error)) + '\n\nVérifiez la clé API (API_KEY) en haut de peertopeer-sendData.js');
    });

    //==============================
    // START CHAT
    //==============================
    $('#start-data').on('click', function(e) {
        // Get contact from it's id
        var contactId = document.getElementById('contact-id').value;
        if (contactId !== '') {
            addContactToActiveDataBox(contactId.toString());
            setActiveContact(contactId);
        }
    });
    $('#contact-id').keypress(function (e) {
        if (e.which == 13) {
            // Get contact from it's id
            var contactId = document.getElementById('contact-id').value;
            if (contactId !== '') {
                addContactToActiveDataBox(contactId.toString());
                setActiveContact(contactId);
            }
            return false;
        }
    });

    //==============================
    // SEND CHAT MESSAGE TO ACTIVE CONTACT
    //==============================
    $('#send-message').on('click', function() {
        sendMessageToActiveContact($('#typing-area').val().toString());
    });
    $('#typing-area').keypress(function (e) {
        if (e.which == 13) {
            sendMessageToActiveContact($('#typing-area').val().toString());
            return false;
        }
    });
});
