// This file contains JavaScript for the dashboard functionalities.

document.addEventListener('DOMContentLoaded', function() {
    fetchTimesheets();
});

function fetchTimesheets() {
    fetch('/admin/timesheets')
        .then(response => response.json())
        .then(data => {
            displayTimesheets(data);
        })
        .catch(error => console.error('Error fetching timesheets:', error));
}

function displayTimesheets(timesheets) {
    const timesheetContainer = document.getElementById('timesheet-container');
    timesheetContainer.innerHTML = '';

    timesheets.forEach(timesheet => {
        const timesheetDiv = document.createElement('div');
        timesheetDiv.classList.add('timesheet');

        const employeeName = document.createElement('h3');
        employeeName.textContent = timesheet.employeeName;
        timesheetDiv.appendChild(employeeName);

        const timesheetDetails = document.createElement('p');
        timesheetDetails.textContent = `Date: ${timesheet.date}, Hours: ${timesheet.hours}`;
        timesheetDiv.appendChild(timesheetDetails);

        if (timesheet.missing) {
            timesheetDiv.classList.add('missing');
            const missingMessage = document.createElement('p');
            missingMessage.textContent = 'Missing times not accounted for in leave.';
            timesheetDiv.appendChild(missingMessage);
        }

        timesheetContainer.appendChild(timesheetDiv);
    });
}