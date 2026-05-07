// === CHANGE THIS TO YOUR URL ===
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0MrHvgPTaYGh8v8lyt_dPbalgN5qdj8yZrb7duQRvHRqDIpspYxa367PH2jfHlthz0Q/exec";

let membersData = [];
let isAdmin = false;
let summaryData = {};

$(document).ready(function() {
    $('.nav-link-custom').click(function() {
        $('.nav-link-custom').removeClass('active');
        $(this).addClass('active');
        
        const page = $(this).data('page');
        $('.page').removeClass('active-page');
        $(`#${page}-page`).addClass('active-page');
    });

    loadData();
    setInterval(loadData, 30000); // Auto refresh every 30 sec
});

async function loadData() {
    try {
        $('#loader').show();

        const response = await fetch(`${APP_SCRIPT_URL}?t=${Date.now()}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        membersData = data.members || [];
        summaryData = data.summary || {};

        const totalAmount = Number(summaryData.totalAmount) || 0;
        const totalExpense = Number(summaryData.totalExpense) || 0;
        const month = summaryData.month || "January";

        const totalMembers = membersData.length;
        const totalMeals = membersData.reduce((sum, m) => sum + Number(m.meal || 0), 0);
        const avgAmount = totalMembers > 0 ? Math.round(totalAmount / totalMembers) : 0;

        // Update Dashboard
        $('#total-amt-display').text(`৳ ${totalAmount}`);
        $('#total-exp-display').text(`৳ ${totalExpense}`);
        $('#month-display').text(month);

        $('#total-meals').text(totalMeals);
        $('#total-members').text(totalMembers);
        $('#avg-amount').text(`৳ ${avgAmount}`);

        // Footer
        $('#footer-total').text(`৳ ${totalAmount}`);
        $('#footer-expense').text(`৳ ${totalExpense}`);
        $('#footer-month').text(month);

        // Render Members
        renderMembersTable();

        $('#loader').hide();

    } catch (error) {
        console.error(error);
        $('#loader').html(`<div class="alert alert-danger text-center">Error: ${error.message}</div>`);
    }
}

function renderMembersTable() {
    const tbody = $('#member-list');
    tbody.empty();

    membersData.forEach(member => {
        tbody.append(`
            <tr>
                <td><strong>${member.name}</strong></td>
                <td><span class="badge-taka">৳ ${Number(member.taka)}</span></td>
                <td><span class="badge-meal">${Number(member.meal)}</span></td>
                <td><span class="badge-handcash">৳ ${Number(member.handcash)}</span></td>
            </tr>
        `);
    });
}

function openLoginModal() {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

function doLogin() {
    const user = $('#adminUser').val();
    const pass = $('#adminPass').val();

    if (user === "admin" && pass === "admin123") {
        isAdmin = true;
        alert("✅ Admin Login Successful!");
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        loadData();
    } else {
        alert("❌ Wrong Username or Password!");
    }
}
