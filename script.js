// CHANGE THIS TO YOUR APPS SCRIPT URL
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwAarw1kAdGrfBT8PUyCOyhoc06NekPVUx89bdpYCDNKae8Z0U9vuWi7x1xQYn7AZRKqA/exec";

let membersData = [];
let isAdmin = false;
let summaryData = {};

$(document).ready(function() {
    $('.nav-item').click(function() {
        const page = $(this).data('page');
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        $('.page').removeClass('active');
        $(`#${page}-page`).addClass('active');
    });
    
    loadData();
    setInterval(loadData, 30000);
});

async function loadData() {
    try {
        $('#loader').show();
        
        const response = await fetch(`${APP_SCRIPT_URL}?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || "Unknown error");
        }
        
        membersData = data.members || [];
        summaryData = data;
        
        // Calculate totals
        const totalAmount = membersData.reduce((sum, m) => sum + (Number(m.taka) || 0), 0);
        const totalMembers = membersData.length;
        const avgAmount = totalMembers > 0 ? totalAmount / totalMembers : 0;
        const totalExpense = Number(data.totalExpense) || 0;
        const month = data.month || 'January';
        
        // Update UI
        $('#totalAmount').text(`৳ ${totalAmount.toFixed(2)}`);
        $('#totalExpense').text(`৳ ${totalExpense.toFixed(2)}`);
        $('#monthName').text(month);
        $('#totalMembers').text(totalMembers);
        $('#avgAmount').text(`৳ ${avgAmount.toFixed(2)}`);
        $('#footerAmount').text(`৳ ${totalAmount.toFixed(2)}`);
        $('#footerExpense').text(`৳ ${totalExpense.toFixed(2)}`);
        $('#footerMonth').text(month);
        
        // Update note
        if (data.note && data.note !== "") {
            $('#noteDisplay').html(`<i class="fas fa-sticky-note"></i> ${data.note}`);
        } else {
            $('#noteDisplay').html(`<i class="fas fa-sticky-note"></i> No notes. Login as admin to add.`);
        }
        
        // Render members table
        const tbody = $('#membersTable');
        tbody.empty();
        membersData.forEach((member, idx) => {
            tbody.append(`<tr>
                <td>${idx + 1}</td>
                <td><i class="fas fa-user-circle"></i> ${member.name}</td>
                <td><span class="badge-taka">৳ ${Number(member.taka).toFixed(2)}</span></td>
            </tr>`);
        });
        
        // Update admin panel if logged in
        if (isAdmin) {
            loadMemberEditList();
            $('#expenseInput').val(totalExpense);
            $('#noteInput').val(data.note || '');
        }
        
        $('#loader').hide();
        
    } catch(error) {
        console.error(error);
        $('#loader').html(`<div class="alert alert-danger m-3">Error: ${error.message}<br><br>Check: Apps Script URL correct? Deployed with "Anyone" access?</div>`);
    }
}

function loadMemberEditList() {
    const container = $('#memberEditList');
    container.empty();
    
    membersData.forEach((member, idx) => {
        container.append(`
            <div class="member-edit-item">
                <div><strong>${member.name}</strong><br><small>Current: ৳ ${Number(member.taka).toFixed(2)}</small></div>
                <div>
                    <input type="number" id="editTaka_${idx}" value="${member.taka}" class="form-control" style="width: 150px; display: inline-block;">
                    <button class="btn btn-warning btn-sm" onclick="updateMemberTaka(${idx})">Update</button>
                </div>
            </div>
        `);
    });
}

async function updateMemberTaka(index) {
    if (!isAdmin) {
        alert('Please login as admin first!');
        return;
    }
    
    const newTaka = parseFloat($(`#editTaka_${index}`).val()) || 0;
    
    try {
        await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'updateMember', index: index, taka: newTaka })
        });
        alert('✅ Member deposit updated successfully!');
        loadData();
    } catch(e) {
        alert('Error: ' + e.message);
    }
}

async function updateExpense() {
    if (!isAdmin) {
        alert('Please login as admin first!');
        return;
    }
    
    const expense = parseFloat($('#expenseInput').val());
    if (isNaN(expense)) {
        alert('Please enter a valid expense amount');
        return;
    }
    
    try {
        await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'updateExpense', expense: expense })
        });
        alert('✅ Total expense updated successfully!');
        loadData();
    } catch(e) {
        alert('Error: ' + e.message);
    }
}

async function updateNote() {
    if (!isAdmin) {
        alert('Please login as admin first!');
        return;
    }
    
    const note = $('#noteInput').val();
    
    try {
        await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'updateNote', note: note })
        });
        alert('✅ Note updated successfully!');
        loadData();
    } catch(e) {
        alert('Error: ' + e.message);
    }
}

function showLoginModal() {
    $('#loginUser').val('');
    $('#loginPass').val('');
    $('#loginError').addClass('d-none');
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

function doLogin() {
    const user = $('#loginUser').val();
    const pass = $('#loginPass').val();
    
    if (user === 'admin' && pass === 'admin123') {
        isAdmin = true;
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        $('.login-btn').html('<i class="fas fa-user-check"></i> Admin Mode').addClass('admin-mode');
        $('#adminLoginAlert').hide();
        $('#adminControls').show();
        loadMemberEditList();
        $('#expenseInput').val(summaryData.totalExpense || '');
        $('#noteInput').val(summaryData.note || '');
        alert('✅ Admin login successful! Now you can edit data.');
    } else {
        $('#loginError').removeClass('d-none').text('❌ Invalid username or password!');
    }
}
