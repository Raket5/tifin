const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyokN5x09ApLnXj5gpyQGFnz4Vek3z7JbgeL0UQ6daukzsh2kcbw4MerKo-HYinlHbr/exec";

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
        
        // Refresh admin panel if needed
        if (page === 'admin' && isAdmin) {
            loadMemberEditList();
        }
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
        summaryData = data.summary || {};
        
        // Update Dashboard
        const totalAmount = membersData.reduce((sum, m) => sum + (Number(m.taka) || 0), 0);
        const totalMembers = membersData.length;
        const avgAmount = totalMembers > 0 ? totalAmount / totalMembers : 0;
        
        $('#totalAmount').text(`৳ ${totalAmount.toFixed(2)}`);
        $('#totalExpense').text(`৳ ${(summaryData.totalExpense || 0).toFixed(2)}`);
        $('#monthName').text(summaryData.month || 'January');
        $('#totalMeals').text('0'); // You can calculate from meal data if available
        $('#totalMembers').text(totalMembers);
        $('#avgAmount').text(`৳ ${avgAmount.toFixed(2)}`);
        $('#footerAmount').text(`৳ ${totalAmount.toFixed(2)}`);
        $('#footerExpense').text(`৳ ${(summaryData.totalExpense || 0).toFixed(2)}`);
        $('#footerMonth').text(summaryData.month || 'January');
        
        // Display note
        if (summaryData.note) {
            $('#noteDisplay').html(`<i class="fas fa-sticky-note"></i> ${summaryData.note}`);
        } else {
            $('#noteDisplay').html(`<i class="fas fa-sticky-note"></i> No notes yet. Login as admin to add notes.`);
        }
        
        // Update Members Table
        renderMembersTable();
        
        // Update Admin Edit List if logged in
        if (isAdmin) {
            loadMemberEditList();
        }
        
        $('#loader').hide();
        
    } catch (error) {
        console.error('Error:', error);
        $('#loader').html(`<div class="alert alert-danger m-3"><strong>Error:</strong> ${error.message}<br><br>Check console for details.</div>`);
    }
}

function renderMembersTable() {
    const tbody = $('#membersTable');
    tbody.empty();
    
    membersData.forEach((member, index) => {
        const row = `<tr>
            <td>${index + 1}</td>
            <td><i class="fas fa-user-circle"></i> ${member.name}</td>
            <td><span class="badge badge-taka">৳ ${Number(member.taka).toFixed(2)}</span></td>
            <td><span class="badge badge-meal"><i class="fas fa-check-circle"></i> Active</span></td>
        </tr>`;
        tbody.append(row);
    });
}

function loadMemberEditList() {
    const tbody = $('#memberEditList');
    tbody.empty();
    
    membersData.forEach((member, index) => {
        const row = `<tr>
            <td>${member.name}</td>
            <td>৳ ${Number(member.taka).toFixed(2)}</td>
            <td><input type="number" id="editTaka_${index}" class="form-control form-control-sm" value="${member.taka}" style="width:120px"></td>
            <td><button class="btn btn-sm btn-warning" onclick="updateMemberTaka(${index})">Update</button></td>
        </tr>`;
        tbody.append(row);
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
        
        alert('✅ Member deposit updated!');
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
        
        alert('✅ Total expense updated!');
        $('#expenseInput').val('');
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
        
        alert('✅ Note updated!');
        $('#noteInput').val('');
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
