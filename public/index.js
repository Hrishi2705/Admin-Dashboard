document.addEventListener('DOMContentLoaded', () => {
  fetchData(1); // Fetch data for the first page
  setupPagination();
});


let totalPages = 1; // Move totalPages declaration outside of fetchData function
let currentPage = 1; // Move currentPage declaration outside of fetchData function
let salesPeopleMap = new Map(); // Declare salesPeopleMap at a higher scope

async function fetchData(page, searchQuery = '') {
  try {
    const response = await fetch(`/api/salespeople?page=${page}&search=${searchQuery}`);
    const { data, salesPeopleData, total, currentPage: fetchedPage } = await response.json();
    const tableBody = document.getElementById('tableBody');
    const currentPageSpan = document.getElementById('currentPage');

    tableBody.innerHTML = ''; // Clear existing rows

    // Populate salesPeopleMap with the received data
    salesPeopleMap = new Map(salesPeopleData.map(person => [person.phone, person]));

    for (const row of data) {
      // Convert row.salesPerson to number if needed
      const salesPersonKey = typeof row.salesPerson === 'number' ? row.salesPerson : parseInt(row.salesPerson);

      const sp = salesPeopleMap.get(salesPersonKey);
      const assignedArea = sp && sp.assignedArea ? sp.assignedArea : 'Not Assigned';
      const status = sp && sp.isActive ? 'Active' : 'Inactive'; // Determine status based on isActive field
      row.assignedArea = assignedArea;
      row.status = status; // Add status field to row data
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td id="statusColumn" class="fix">${row.status}</td>
        <td class="fix">${row.salesPersonName}</td>
        <td>${row.salesPerson}</td>
        <td>${row.totalStoresCreated}</td>
        <td>${row.documentsPending}</td>
        <td>${row.appDownloadPending}</td>
        <td>${row.rejected}</td>
        <td class="assignedArea">${row.assignedArea}</td>
        <td class="actionColumn">
        <button class="btn btn-icon btn-2 btn-primary" type="button" id="editButton" data-salesperson="${row.salesPerson}">
           <span class="btn-inner--icon"> Edit <i class="fa-regular fa-pen-to-square fa-2xl" style="color: #b9c1cf;"></i></i></span>
        </button>
        <button class="btn btn-icon btn-2 btn-primary" type="button" id="saveButton" data-salesperson="${row.salesPerson}" style="display: none;">
           <span class="btn-inner--icon"> Save <i class="fa-regular fa-floppy-disk fa-2xl" style="color: #b9c1cf;"></i></i></span>
        </button>
        </td>
      `;

      tableBody.appendChild(newRow);

      const assignedAreaCell = newRow.querySelector('.assignedArea');
      const statusColumn = newRow.querySelector('#statusColumn'); // Get the status column
      const editButton = newRow.querySelector('#editButton');
      const saveButton = newRow.querySelector('#saveButton');

      // Add click event listener to edit button
      editButton.addEventListener('click', () => handleEditButtonClick(sp, assignedAreaCell, editButton, saveButton));

      // Set the status column based on the status
      statusColumn.innerHTML = `<span class="badge badge-${sp.isActive ? 'success' : 'secondary'}">${sp.isActive ? 'Active' : 'Inactive'}</span>`;

    }

    totalPages = total; // Update totalPages
    currentPage = fetchedPage; // Update currentPage

    currentPageSpan.textContent = `Page: ${currentPage} of ${totalPages}`;

    updatePaginationButtons(); // Call the function to update button states
  } catch (error) {
    console.error(error);
  }
}

function handleEditButtonClick(salesPerson, assignedAreaCell, editButton, saveButton) {
  // Hide the edit button and show the save button
  editButton.style.display = 'none';
  saveButton.style.display = 'inline';

  // Create input field
  const inputField = document.createElement('input');
  inputField.className = 'form-control';
  inputField.type = '';
  inputField.value = salesPerson.assignedArea;

  // Append input field
  assignedAreaCell.textContent = '';
  assignedAreaCell.appendChild(inputField);

  // Add click event listener to save button
  saveButton.addEventListener('click', async () => {
    // Update value in MongoDB
    const updatedValue = inputField.value;
    await updateAssignedArea(salesPerson._id, updatedValue);

    // Update UI
    assignedAreaCell.textContent = updatedValue;

    // Show the edit button and hide the save button
    editButton.style.display = 'inline';
    saveButton.style.display = 'none';
  });
}

async function updateAssignedArea(salesPersonId, assignedArea) {
  try {
    // Make API call to update assigned area in MongoDB
    const response = await fetch(`/api/updateAssignedArea/${salesPersonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignedArea }), // Make sure assignedArea is defined
    });

    const data = await response.json();
    console.log('Assigned Area updated:', data);
  } catch (error) {
    console.error('Error updating assigned area:', error);
  }
}

function setupPagination() {
  const firstPageBtn = document.getElementById('firstPage');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const lastPageBtn = document.getElementById('lastPage');

  firstPageBtn.addEventListener('click', () => {
    if (currentPage !== 1) {
      currentPage = 1;
      fetchData(currentPage);
    }
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchData(currentPage);
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchData(currentPage);
    }
  });

  lastPageBtn.addEventListener('click', () => {
    if (currentPage !== totalPages) {
      currentPage = totalPages;
      fetchData(currentPage);
    }
  });

  updatePaginationButtons(); // Call the function to update button states

  document.getElementById('searchInput').addEventListener('input', () => {
    const searchQuery = document.getElementById('searchInput').value;
    fetchData(1, searchQuery);
  });
}

function updatePaginationButtons() {
  const firstPageBtn = document.getElementById('firstPage');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const lastPageBtn = document.getElementById('lastPage');

  firstPageBtn.disabled = currentPage === 1;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  lastPageBtn.disabled = currentPage === totalPages;
}
