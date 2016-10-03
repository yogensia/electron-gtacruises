// save options
function save_options() {
	// get opctions from form
	var notificationsDisableAll_val   = document.getElementById('notificationsDisableAll').checked;
	var notificationsDisable30min_val = document.getElementById('notificationsDisable30min').checked;
	var notificationsDisable15min_val = document.getElementById('notificationsDisable15min').checked;
	var notificationsDisableNew_val   = document.getElementById('notificationsDisableNew').checked;
	var notificationsDisableGTAV_val   = document.getElementById('notificationsDisableGTAV').checked;
	var notificationsDisableForza_val   = document.getElementById('notificationsDisableForza').checked;
	// save options to chrome.storage.sync
	chrome.storage.sync.set({
		notificationsDisableAll:   notificationsDisableAll_val,
		notificationsDisable30min: notificationsDisable30min_val,
		notificationsDisable15min: notificationsDisable15min_val,
		notificationsDisableNew:   notificationsDisableNew_val,
		notificationsDisableGTAV:  notificationsDisableGTAV_val,
		notificationsDisableForza: notificationsDisableForza_val
	}, function() {
		// update status to let user know options were saved
		$('#status').show();
		setTimeout(function() {
			$('#status').fadeOut();
		}, 2000);
	});
}

// restore options
function restore_options() {
	// get options from chrome.storage.sync or defaults
	chrome.storage.sync.get({
		notificationsDisableAll:   false,
		notificationsDisable30min: false,
		notificationsDisable15min: false,
		notificationsDisableNew:   false,
		notificationsDisableGTAV:  false,
		notificationsDisableForza: false
	}, function(items) {
		// populate options form with values
		document.getElementById('notificationsDisableAll').checked   = items.notificationsDisableAll;
		document.getElementById('notificationsDisable30min').checked = items.notificationsDisable30min;
		document.getElementById('notificationsDisable15min').checked = items.notificationsDisable15min;
		document.getElementById('notificationsDisableNew').checked   = items.notificationsDisableNew;
		document.getElementById('notificationsDisableGTAV').checked  = items.notificationsDisableGTAV;
		document.getElementById('notificationsDisableForza').checked = items.notificationsDisableForza;
	});
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);