// আপনার দেওয়া URL ব্যবহার করা হয়েছে
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyjNQb-xZjoSNaV9yh8qysb3c2v5Ko6WLbhufCn_Oro5HIsLZ87cPhnQJsRxZOgTHg7A/exec";

let membersData = [];
let isAdmin = false;
let currentEditIndex = null;

// Navigation
$(document).ready(function() {
    $('.nav-item').click(function() {
        const page = $(this).data('page');
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        $('.page').removeClass('active');
        $(`#${page}-page`).addClass('active');
    });
    
    loadData();
    setInterval(loadData, 15000);
});

// Load data from Google Sheet
async function loadData() {
    try {
        $('#loader').show();
        
        const response = await fetch(`${APP_SCRIPT_URL}?t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        const data = await response.json();
        
        if (!data.success && data.error) {
            throw new Error(data.error);
        }
        
        membersData = data.members || [];
        
        // Calculate totals
        const totalAmount = membersData.reduce((sum, m) => sum + (Number(m.taka) || 0), 0);
        const totalMeals = membersData.reduce((sum, m) => sum + (Number(m.meal) || 0), 0);
        const totalMembers = membersData.length;
        const avgAmount = totalMembers > 0 ? totalAmount / totalMembers : 0;
        const totalExpense = data.summary?.totalExpense || 0;
        const month = data.summary?.month || 'January';
        
        // Update UI
        $('#totalAmount').text(`৳ ${totalAmount.toFixed(2)}`);
        $('#totalExpense').text(`৳ ${totalExpense.toFixed(2)}`);
        $('#monthName').text(month);
        $('#totalMeals').text(totalMeals);
        $('#totalMembers').text(totalMembers);
        $('#avgAmount').text(`৳ ${avgAmount.toFixed(2)}`);
        $('#footerAmount').text(`৳ ${totalAmount.toFixed(2)}`);
        $('#footerExpense').text(`৳ ${totalExpense.toFixed(2)}`);
        $('#footerMonth').text(month);
        
        renderMembersTable();
        $('#loader').hide();
        
    } catch (error) {
        console.error('Error:', error);
        $('#loader').html(`<div class="alert alert-danger m-3">Error: ${error.message}<br><br>Please check:<br>1. Apps Script is deployed<br>2. URL is correct<br>3. 'Who has access: Anyone'</div>`);
    }
}

// Render members table
function renderMembersTable() {
    const tbody = $('#membersTable');
    tbody.empty();
    
    membersData.forEach((member, index) => {
        const mealText = member.meal == 1 ? 'Meal' : 'Meals';
        const editBtn = isAdmin ? `<button class="edit-btn" onclick="openEditModal(${index})"><i class="fas fa-edit"></i> Edit</button>` : '';
        
        const row = `
            <tr>
                <td><i class="fas fa-user-circle"></i> ${member.name}</td>
                <td><span class="badge badge-taka">৳ ${Number(member.taka).toFixed(2)}</span></td>
                <td><span class="badge badge-meal">${member.meal || 0} ${mealText}</span></td>
                <td><span class="badge badge-cash">৳ ${Number(member.handcash).toFixed(2)}</span></td>
                ${editBtn ? `<td>${editBtn}</td>` : ''}
            </tr>
        `;
        tbody.append(row);
    });
}

// Show login modal
function showLoginModal() {
    $('#loginUser').val('');
    $('#loginPass').val('');
    $('#loginError').addClass('d-none');
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

// Do login
function doLogin() {
    const user = $('#loginUser').val();
    const pass = $('#loginPass').val();
    
    // Change password here
    if (user === 'admin' && pass === 'admin123') {
        isAdmin = true;
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        $('.login-btn').html('<i class="fas fa-user-check"></i> Admin Mode').addClass('admin-mode');
        $('#editHeader').show();
        renderMembersTable();
        alert('✅ Login successful! You can now edit data.');
    } else {
        $('#loginError').removeClass('d-none').text('❌ Invalid username or password!');
    }
}

// Open edit modal
function openEditModal(index) {
    if (!isAdmin) {
        alert('Please login as admin first!');
        return;
    }
    
    currentEditIndex = index;
    const member = membersData[index];
    
    $('#editIndex').val(index);
    $('#editName').val(member.name);
    $('#editTaka').val(member.taka);
    $('#editMeal').val(member.meal);
    $('#editHandcash').val(member.handcash);
    
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

// Save edit
async function saveEdit() {
    const updatedMember = {
        name: $('#editName').val(),
        taka: parseFloat($('#editTaka').val()) || 0,
        meal: parseInt($('#editMeal').val()) || 0,
        handcash: parseFloat($('#editHandcash').val()) || 0
    };
    
    membersData[currentEditIndex] = updatedMember;
    
    try {
        await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: membersData })
        });
        
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        await loadData();
        alert('✅ Data updated successfully!');
    } catch(e) {
        alert('Error updating data: ' + e.message);
    }
}
