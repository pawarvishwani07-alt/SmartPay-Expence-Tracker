let userData = null;


const welcomeName =
    document.getElementById("welcomeName");

const incomeAmount =
    document.getElementById("incomeAmount");


let income = 0;


if (userData) {

    welcomeName.textContent =
        "Welcome, " + userData.name + " 👋";

    income = Number(userData.income) || 0;

} else {

    welcomeName.textContent =
        "Welcome to SmartPay 👋";

}


// Display income

incomeAmount.textContent =
    formatMoney(income);



let transactions = [];


const scanPayButton =
    document.getElementById(
        "scanPayButton"
    );

const scanMessage =
    document.getElementById(
        "scanMessage"
    );

const paymentNotification =
    document.getElementById(
        "paymentNotification"
    );

const paymentNotificationTime =
    document.getElementById(
        "paymentNotificationTime"
    );

const transactionTable =
    document.getElementById(
        "transactionTable"
    );

const remainingAmount =
    document.getElementById(
        "remainingAmount"
    );

const balanceIndicator =
    document.getElementById(
        "balanceIndicator"
    );

const balanceProgress =
    document.getElementById(
        "balanceProgress"
    );

const balanceMessage =
    document.getElementById(
        "balanceMessage"
    );

const periodExpense =
    document.getElementById(
        "periodExpense"
    );

const periodTitle =
    document.getElementById(
        "periodTitle"
    );

const pieChart =
    document.getElementById(
        "pieChart"
    );

const chartLegend =
    document.getElementById(
        "chartLegend"
    );

const alertTitle =
    document.getElementById(
        "alertTitle"
    );

const alertText =
    document.getElementById(
        "alertText"
    );

const alertCard =
    document.getElementById(
        "alertCard"
    );

const testAlertButton =
    document.getElementById(
        "testAlertButton"
    );



function formatMoney(amount) {

    return "₹" +
        Number(amount).toLocaleString(
            "en-IN"
        );

}



function getCurrentDate() {

    const now = new Date();

    return now.toLocaleDateString(
        "en-IN"
    );

}



function getCurrentTime() {

    const now = new Date();

    return now.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}



scanPayButton.addEventListener(
    "click",
    async function () {


        /*
            FRONTEND DEMO

            In the real version, this button
            will open a real QR scanner/payment
            system.

            The payment information will then
            come from the payment system.

            The user will NOT manually enter
            an expense.
        */


        const demoPayment = {

            date: getCurrentDate(),

            time: getCurrentTime(),

            purpose: "Food",

            amount: 250

        };


        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ purpose: demoPayment.purpose, amount: demoPayment.amount })
            });
            const result = await response.json();

            if (!response.ok) {
                scanMessage.textContent = result.error || "Payment could not be saved.";
                return;
            }
            transactions.unshift(result.transaction);
        } catch (error) {
            scanMessage.textContent = "Unable to connect to SmartPay.";
            return;
        }


        // Show payment notification

        paymentNotification.textContent =
            "You paid " +
            formatMoney(
                demoPayment.amount
            ) +
            " for " +
            demoPayment.purpose;


        paymentNotificationTime.textContent =
            demoPayment.date +
            " • " +
            demoPayment.time;


        scanMessage.textContent =
            "Payment successful. Expense added automatically.";


        // Refresh everything

        updateDashboard();

    }
);



function getTotalExpense() {

    return transactions.reduce(
        function (total, transaction) {

            return total +
                Number(transaction.amount);

        },
        0
    );

}



function updateBalance() {

    const totalExpense =
        getTotalExpense();


    const remaining =
        income - totalExpense;


    remainingAmount.textContent =
        formatMoney(
            Math.max(remaining, 0)
        );


    updateBalanceIndicator(
        remaining
    );

}



function updateBalanceIndicator(
    remaining
) {

    balanceIndicator.className =
        "balance-indicator";


    let percentage = 100;


    if (income > 0) {

        percentage =
            (remaining / income) * 100;

    }


    if (percentage > 50) {

        // GREEN

        balanceIndicator.classList.add(
            "green"
        );

        balanceIndicator.innerHTML =
            "<span></span><strong>Safe</strong>";

        balanceMessage.textContent =
            "Your available amount is healthy.";

        balanceProgress.style.background =
            "#22c55e";

    }

    else if (percentage > 20) {

        // YELLOW

        balanceIndicator.classList.add(
            "yellow"
        );

        balanceIndicator.innerHTML =
            "<span></span><strong>Caution</strong>";

        balanceMessage.textContent =
            "Your remaining amount is getting lower.";

        balanceProgress.style.background =
            "#eab308";

    }

    else {

        // RED

        balanceIndicator.classList.add(
            "red"
        );

        balanceIndicator.innerHTML =
            "<span></span><strong>Low</strong>";

        balanceMessage.textContent =
            "Your remaining amount is very low.";

        balanceProgress.style.background =
            "#ef4444";

    }


    const safePercentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    balanceProgress.style.width =
        safePercentage + "%";


    updateAlert(
        remaining,
        percentage
    );

}



function updateAlert(
    remaining,
    percentage
) {

    if (
        income > 0 &&
        percentage <= 20
    ) {

        alertTitle.textContent =
            "Low Balance Alert";

        alertText.textContent =
            "You have only " +
            formatMoney(
                Math.max(
                    remaining,
                    0
                )
            ) +
            " remaining.";


        alertCard.style.borderColor =
            "rgba(239, 68, 68, 0.35)";

    }

    else if (
        income > 0 &&
        percentage <= 50
    ) {

        alertTitle.textContent =
            "Budget Alert";

        alertText.textContent =
            "Your available amount is getting low. " +
            "You have " +
            formatMoney(
                Math.max(
                    remaining,
                    0
                )
            ) +
            " remaining.";


        alertCard.style.borderColor =
            "rgba(234, 179, 8, 0.35)";

    }

    else {

        alertTitle.textContent =
            "Your balance is healthy";

        alertText.textContent =
            "SmartPay will alert you when " +
            "your available amount becomes low.";

        alertCard.style.borderColor =
            "rgba(255, 255, 255, 0.12)";

    }

}



function updateTransactionTable() {

    transactionTable.innerHTML = "";


    if (transactions.length === 0) {

        transactionTable.innerHTML = `
            <tr>
                <td colspan="4">
                    No payments yet.
                </td>
            </tr>
        `;

        return;

    }


    transactions.forEach(
        function (transaction) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${transaction.date}
                </td>

                <td>
                    ${transaction.time}
                </td>

                <td>
                    ${transaction.purpose}
                </td>

                <td>
                    -${formatMoney(
                        transaction.amount
                    )}
                </td>

            `;


            transactionTable.appendChild(
                row
            );

        }
    );

}



let currentPeriod = "day";


function calculatePeriodExpense(
    period
) {

    /*
        This frontend demo uses the saved
        transaction dates.

        Later the backend/database will
        provide the real transaction data.
    */


    const now = new Date();


    if (period === "day") {

        return transactions.reduce(
            function (total, transaction) {

                const transactionDate =
                    new Date(
                        transaction.date
                    );


                if (
                    transactionDate.toDateString() ===
                    now.toDateString()
                ) {

                    return total +
                        Number(
                            transaction.amount
                        );

                }


                return total;

            },
            0
        );

    }


    if (period === "week") {

        return transactions.reduce(
            function (total, transaction) {

                const transactionDate =
                    new Date(
                        transaction.date
                    );


                const difference =
                    now - transactionDate;


                const days =
                    difference /
                    (1000 * 60 * 60 * 24);


                if (days <= 7) {

                    return total +
                        Number(
                            transaction.amount
                        );

                }


                return total;

            },
            0
        );

    }


    if (period === "month") {

        return transactions.reduce(
            function (total, transaction) {

                const transactionDate =
                    new Date(
                        transaction.date
                    );


                if (
                    transactionDate.getMonth() ===
                    now.getMonth() &&

                    transactionDate.getFullYear() ===
                    now.getFullYear()
                ) {

                    return total +
                        Number(
                            transaction.amount
                        );

                }


                return total;

            },
            0
        );

    }


    return 0;

}



function updatePeriod() {

    const amount =
        calculatePeriodExpense(
            currentPeriod
        );


    if (currentPeriod === "day") {

        periodTitle.textContent =
            "Today's Expense";

    }

    else if (
        currentPeriod === "week"
    ) {

        periodTitle.textContent =
            "This Week's Expense";

    }

    else {

        periodTitle.textContent =
            "This Month's Expense";

    }


    periodExpense.textContent =
        formatMoney(amount);

}



function updatePieChart() {

    const categories = {};


    transactions.forEach(
        function (transaction) {

            const category =
                transaction.purpose;


            if (!categories[category]) {

                categories[category] = 0;

            }


            categories[category] +=
                Number(
                    transaction.amount
                );

        }
    );


    const values =
        Object.values(categories);


    const names =
        Object.keys(categories);


    if (values.length === 0) {

        pieChart.style.background =
            "rgba(255,255,255,0.08)";

        chartLegend.innerHTML =
            "<span class='legend-item'>No expenses yet</span>";

        return;

    }


    const total =
        values.reduce(
            (a, b) => a + b,
            0
        );


    const colors = [
        "#38bdf8",
        "#22c55e",
        "#facc15",
        "#ef4444",
        "#a78bfa",
        "#fb923c"
    ];


    let currentDegree = 0;

    let gradientParts = [];


    names.forEach(
        function (name, index) {

            const degree =
                (
                    values[index] /
                    total
                ) * 360;


            const nextDegree =
                currentDegree +
                degree;


            gradientParts.push(
                colors[index % colors.length] +
                " " +
                currentDegree +
                "deg " +
                nextDegree +
                "deg"
            );


            currentDegree =
                nextDegree;

        }
    );


    pieChart.style.background =
        "conic-gradient(" +
        gradientParts.join(",") +
        ")";


    chartLegend.innerHTML = "";


    names.forEach(
        function (name, index) {

            const item =
                document.createElement(
                    "span"
                );


            item.className =
                "legend-item";


            item.textContent =
                name +
                " " +
                formatMoney(
                    values[index]
                );


            chartLegend.appendChild(
                item
            );

        }
    );

}



const periodButtons =
    document.querySelectorAll(
        ".period-btn"
    );


periodButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                periodButtons.forEach(
                    function (btn) {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentPeriod =
                    button.dataset.period;


                updatePeriod();

            }
        );

    }
);



testAlertButton.addEventListener(
    "click",
    function () {

        const remaining =
            income -
            getTotalExpense();


        if (
            "speechSynthesis" in window
        ) {

            const message =
                "SmartPay alert. " +
                "You have only " +
                Math.max(
                    remaining,
                    0
                ) +
                " rupees remaining.";


            const speech =
                new SpeechSynthesisUtterance(
                    message
                );


            speech.rate = 0.9;

            speech.pitch = 1;

            speech.volume = 1;


            window.speechSynthesis.speak(
                speech
            );

        }

    }
);



const logoutLink =
    document.getElementById(
        "logoutLink"
    );


logoutLink.addEventListener(
    "click",
    async function () {
        await fetch("/api/logout", { method: "POST" });

    }
);



async function loadDashboardData() {
    const userResponse = await fetch("/api/me");
    if (!userResponse.ok) {
        updateDashboard();
        return;
    }

    const userResult = await userResponse.json();
    userData = userResult.user;
    income = Number(userData.income) || 0;
    welcomeName.textContent = "Welcome, " + userData.name + " 👋";
    incomeAmount.textContent = formatMoney(income);

    const transactionsResponse = await fetch("/api/transactions");
    const transactionsResult = await transactionsResponse.json();
    transactions = transactionsResult.transactions || [];
    updateDashboard();
}


function updateDashboard() {

    updateBalance();

    updateTransactionTable();

    updatePeriod();

    updatePieChart();

}

loadDashboardData().catch(function () {
    updateDashboard();
});



updateDashboard();