document.addEventListener('DOMContentLoaded', () => {
  fetchData(1); // Fetch data for the first page
  setupPagination();
});

let totalPages = 1; // Move totalPages declaration outside of fetchData function
let currentPage = 1; // Move currentPage declaration outside of fetchData function
let currentSearchQuery = ''; // Added variable to store the current search query
let currentSelectedStatus = '';
let isDateAscending = false; 


async function fetchData(page) {
  try {
    const searchQuery = document.getElementById('searchInput').value || '';
    // const selectedStatus = document.getElementById('storeStatusFilter').value || '';
    const selectedStatus = currentSelectedStatus || '';
    const sortOrder = isDateAscending ? 1 : -1; 
    const response = await fetch(`/api/stores?page=${page}&search=${searchQuery}&status=${selectedStatus}&sortOrder=${sortOrder}`);
    const { data, total, currentPage: fetchedPage } = await response.json();
    const tableBody = document.getElementById('tableBody');
    const currentPageSpan = document.getElementById('currentPage');

    tableBody.innerHTML = ''; // Clear existing rows

    for (const row of data) {
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td class="fix">${row.storeName}</td>
        <td class="fix">${row.salesPersonName}</td>
        <td class="fix">${formatDate(row.createdDate)}</td>
        <td>${row.salesPerson}</td>
        <td>${row.registrationStatus}</td>
        <td>${row.storeStatus}</td>
      `;

      tableBody.appendChild(newRow);
    }

    totalPages = total; // Update totalPages
    currentPage = fetchedPage; // Update currentPage

    currentPageSpan.textContent = `Page: ${currentPage} of ${totalPages}`;

    updatePaginationButtons(); // Call the function to update button states
  } catch (error) {
    console.error(error);
  }
}


// Add sorting functionality
function clickupArrow() {
  isDateAscending = false;
  disableEnableSortButtons();
  fetchData(currentPage);
}

function clickDownArrow() {
  isDateAscending = true;
  disableEnableSortButtons();
  fetchData(currentPage);
}

// Add function to disable/enable sort buttons based on the sorting order
function disableEnableSortButtons() {
  const upArrowBtn = document.querySelector('.up-arrow');
  const downArrowBtn = document.querySelector('.down-arrow');

  upArrowBtn.disabled = isDateAscending;
  downArrowBtn.disabled = !isDateAscending;
}

function formatDate(dateString) {
  if (!dateString) {
    return null; // Return null if dateString is not available
  }

  const options = { day: 'numeric', month: 'numeric', year: '2-digit' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', options);
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

  document.getElementById('searchInput').addEventListener('input', () => {
    const searchQuery = document.getElementById('searchInput').value;
    currentSearchQuery = searchQuery; // Update the current search query
    fetchData(1); // Fetch data for the first page when search changes
  });

// Updated dropdown event listener
document.querySelectorAll('.dropdown-item').forEach((item) => {
  item.addEventListener('click', () => {
    const selectedStatus = item.getAttribute('data-value');
    currentSelectedStatus = selectedStatus; // Update the current selected status
    fetchData(1); // Fetch data for the first page when dropdown item is clicked
  });
});

  updatePaginationButtons(); // Call the function to update button states

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
