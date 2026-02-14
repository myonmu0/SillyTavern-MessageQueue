// The main script for the extension
// The following are examples of some basic extension functionality

//You'll likely need to import extension_settings, getContext, and loadExtensionSettings from extensions.js
import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { saveSettingsDebounced } from "../../../../script.js";

// Keep track of where your extension is located, name should match repo name
const extensionName = "SillyTavern-MessageQueue";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {};

// Loads the extension settings if they exist, otherwise initializes them to the defaults.
async function loadSettings() {
  //Create the settings if they don't exist
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0 ||
      extension_settings[extensionName].messagequeue_setting_split_enable === undefined ||
      extension_settings[extensionName].messagequeue_setting_split_delimiter === undefined) {

    // Default values
    Object.assign(extension_settings[extensionName], defaultSettings);
    extension_settings[extensionName].messagequeue_setting_enable = true;
    extension_settings[extensionName].messagequeue_setting_split_enable = false;
    extension_settings[extensionName].messagequeue_setting_split_delimiter = "|||";
    saveSettingsDebounced();
  }

  // Updating settings in the UI
  $("#messagequeue_setting_enable").prop("checked", extension_settings[extensionName].messagequeue_setting_enable).trigger("input");
  $("#messagequeue_setting_split_enable").prop("checked", extension_settings[extensionName].messagequeue_setting_split_enable).trigger("input");
  $("#messagequeue_setting_split_delimiter").val(extension_settings[extensionName].messagequeue_setting_split_delimiter).trigger("input");
}

function onMessageQueueSetting_enable(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].messagequeue_setting_enable = value;
  saveSettingsDebounced();

  // Enable extention
  if( value == true ) {
     messageQueue_addHook();

  // Disable extention
  } else {
     messageQueue_removeHook();
  }
}

function onMessageQueueSetting_split(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].messagequeue_setting_split_enable = value;
  saveSettingsDebounced();

  if( value == true ) {
     messageQueue_split = true
  } else {
     messageQueue_split = false
  }
}

function onMessageQueueSetting_splitDelimiter(event) {
  const value = $(event.target).val();
  extension_settings[extensionName].messagequeue_setting_split_delimiter = value;
  saveSettingsDebounced();

  messageQueue_split_delimiter = value;
}


// This function is called when the extension is loaded
jQuery(async () => {
  // This is an example of loading HTML from a file
  const settingsHtml = await $.get(`${extensionFolderPath}/config.html`);

  $("#extensions_settings").append(settingsHtml);
  $("#messagequeue_setting_enable").on("input", onMessageQueueSetting_enable);
  $("#messagequeue_setting_split_enable").on("input", onMessageQueueSetting_split);
  $("#messagequeue_setting_split_delimiter").on("input", onMessageQueueSetting_splitDelimiter);

  // Load settings when starting things up (if you have any)
  loadSettings();

  // Init Message Queue
  messageQueue_waitToInit();
});


// Globals
window.messageQueue = window.messageQueue || [];
window.messageQueue_split = window.messageQueue_split || false;
window.messageQueue_split_delimiter = window.messageQueue_split_delimiter || "";


// Functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function messageQueue_waitToInit(message, delay = 10) {
  await sleep(delay);
  messageQueue_init()
}

function messageQueue_init() {
    insertBadge('send_but', 'messageQueue-count-badge1');
    insertBadge('mes_stop', 'messageQueue-count-badge2');

    function insertBadge(targetElementId, newId) {
          const targetElement = document.getElementById(targetElementId);
          if (!targetElement) {
              return null;
          }
          
          let badge = targetElement.querySelector('.' + newId);
          if (!badge) {
              badge = document.createElement('div');
              badge.className = newId;
              badge.textContent = '0';
              
        Object.assign(badge.style, {
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            transform: 'translate(50%, -50%)',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '12px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            zIndex: '10000',
            pointerEvents: 'none'
        });

        targetElement.appendChild(badge);
        
        if (getComputedStyle(targetElement).position === 'static') {
            targetElement.style.position = 'relative';
            }
        }
          
          return badge;
      }

    // Send message from queue
    setInterval(function() {
        if (messageQueue.length >0 && document.visibilityState === 'visible') {
          const sendButton = document.getElementById('send_but');
          const sendTextarea = document.getElementById('send_textarea');
          
          if (sendButton && sendTextarea && sendTextarea.readOnly === false) {
              const displayStyle = getComputedStyle(sendButton).display;

              if (displayStyle === 'flex') {
                    const sendTextarea = document.getElementById('send_textarea');
                    if (sendTextarea.value == '') {

                        const textToSend =  messageQueue[0]
                        const sendButton = document.getElementById('send_but');
                        const sendTextarea_style_back_height = sendTextarea.style.height;
                        const sendTextarea_style_back_overflow = sendTextarea.style.overflow;

                        sendTextarea.readOnly = true;
                        sendTextarea.style.setProperty('height', '', 'important');
                        sendTextarea.style.setProperty('overflow', 'hidden', 'important');
                        sendTextarea.value = textToSend;
                        sendButton.style.pointerEvents = 'none';

                       setTimeout(function() {
                            if (sendButton) {
                                // Final check of textarea
                                if(sendTextarea.value == textToSend && document.visibilityState === 'visible') {
                                    sendButton.click();
                                    messageQueue_dequeue();
                                // Remove added text if user are typing
                                } else {
                                    sendTextarea.value = messageQueue_removeFirstMatch(sendTextarea.value, textToSend);
                                }
                            }
                            setTimeout(function() {
                                sendTextarea.readOnly = false;
                                sendTextarea.style.height = sendTextarea_style_back_height;
                                sendTextarea.style.overflow = sendTextarea_style_back_overflow;
                                sendButton.style.pointerEvents = '';
                            }, 100);
                        }, 200);
                      }
                     }
                  }
          }
    }, 500);
}

function messageQueue_getBadge() {
    return document.querySelector('.messageQueue-count-badge1');
}
function messageQueue_getBadge2() {
    return document.querySelector('.messageQueue-count-badge2');
}

function messageQueue_updateBadge(count) {
    const mainFontFamily = getComputedStyle(document.documentElement).getPropertyValue('--mainFontFamily').trim();
    const badge = messageQueue_getBadge();
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
            badge.style.top = '15px';
            badge.style.right = '5px';
            badge.style.left = '';
            badge.style.fontFamily = mainFontFamily;
        } else {
            badge.textContent = '';
            badge.style.display = 'none';
        }
    }
    const badge2 = messageQueue_getBadge2();
    if (badge2) {
        if (count > 0) {
            badge2.textContent = count;
            badge2.style.display = 'flex';
            badge2.style.top = '13px';
            badge2.style.right = '5px';
            badge2.style.left = '';
            badge.style.fontFamily = mainFontFamily;
        } else {
            badge2.textContent = '';
            badge2.style.display = 'none';
        }
    }
}

function messageQueue_enqueueText(text) {
    if (text) {
      messageQueue.push(text);

        const badge = messageQueue_getBadge();
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            const newCount = currentCount + 1;
            messageQueue_updateBadge(newCount); 
        }
    }
}

function messageQueue_sendToQueue(event) {
    const sendTextarea = document.getElementById('send_textarea');
    if (sendTextarea) {
        const textContent = sendTextarea.value;
        sendTextarea.value = '';

        // Split
        if( messageQueue_split === true && messageQueue_split_delimiter != "") {
            const regex = new RegExp( messageQueue_split_delimiter.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&'));
            textContent.split(regex).forEach((part, index) => {
              messageQueue_enqueueText(part.trim());
            });
        } else {
          messageQueue_enqueueText(textContent);
        }
     }
}

function messageQueue_dequeueLast() {
    if (messageQueue.length > 0) {
        const removedText = messageQueue.pop();
        const badge = messageQueue_getBadge();
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            const newCount = Math.max(0, currentCount - 1);
            messageQueue_updateBadge(newCount);
        }
        return removedText;
    }
    return null;
}

function messageQueue_dequeue() {
    if (messageQueue.length > 0) {
        const removedText = messageQueue.shift();
        const badge = messageQueue_getBadge();
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            const newCount = Math.max(0, currentCount - 1);
            messageQueue_updateBadge(newCount);
        }
        return removedText;
    }
    return null;
}

// Hook form_sheld
function　messageQueue_hook_form_sheld(e) {

    if (e.key === 'Enter' && !e.shiftKey) {
    
        const sendButton = document.getElementById('send_but');
        const computedStyle = getComputedStyle(sendButton);
        
        // Split function
        if (messageQueue_split === true && messageQueue_split_delimiter != "") {
        const regex = new RegExp(messageQueue_split_delimiter.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&'));
        if( regex.test(document.getElementById('send_textarea').value)) {
           e.preventDefault();
           e.stopPropagation();
           messageQueue_sendToQueue(e);
          }
        }

        if (messageQueue.length >0 || computedStyle.display != "flex") {
         e.preventDefault();
         e.stopPropagation();
         messageQueue_sendToQueue(e);
        }

    } else if (e.key === 'Delete' && e.shiftKey) {
        if( e.target.id == "send_textarea" ) {
          messageQueue_dequeueLast();
        }
    }
}

// Hook send_but
function　messageQueue_hook_send_but(e) {
    if ( document.getElementById('send_textarea').readOnly === false ) {
      if ( messageQueue.length >0 ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); 
        messageQueue_sendToQueue(e);

      // Split
      } else if ( messageQueue_split === true && messageQueue_split_delimiter != "") {
        const regex = new RegExp(messageQueue_split_delimiter.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&'));
        if( regex.test(document.getElementById('send_textarea').value)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation(); 
          messageQueue_sendToQueue(e);
        }
      }
    }
}

function messageQueue_addHook() {
    const formShield = document.getElementById('form_sheld');
    const sendBut = document.getElementById('send_but');
    if (formShield) {
        formShield.addEventListener('keydown', messageQueue_hook_form_sheld);
        sendBut.addEventListener('click', messageQueue_hook_send_but, true);
    }
}

function messageQueue_removeHook() {
    const formShield = document.getElementById('form_sheld');
    const sendBut = document.getElementById('send_but');
    if (formShield) { 
      formShield.removeEventListener('keydown', messageQueue_hook_form_sheld);
      sendBut.removeEventListener('click', messageQueue_hook_send_but, true);
    }
}

function messageQueue_removeFirstMatch(str, target) {
    if (!str || !target) return str;

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const regex = new RegExp(escapeRegExp(target));
    return str.replace(regex, "");
}
