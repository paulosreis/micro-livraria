function newBook(book) {
    const div = document.createElement('div');
    div.className = 'column is-4';
    div.innerHTML = `
        <div class="card is-shady">
            <div class="card-image">
                <figure class="image is-4by3">
                    <img
                        src="${book.photo}"
                        alt="${book.name}"
                        class="modal-button"
                    />
                </figure>
            </div>
            <div class="card-content">
                <div class="content book" data-id="${book.id}">
                    <div class="book-meta">
                        <p class="is-size-4">R$${book.price.toFixed(2)}</p>
                        <p class="is-size-6">Disponível em estoque: 5</p>
                        <h4 class="is-size-3 title">${book.name}</h4>
                        <p class="subtitle">${book.author}</p>
                    </div>
                    <div class="field has-addons">
                        <div class="control">
                            <input class="input" type="text" placeholder="Digite o CEP" />
                        </div>
                        <div class="control">
                            <a class="button button-shipping is-info" data-id="${book.id}"> Calcular Frete </a>
                        </div>
                    </div>
                    <div class="buttons is-fullwidth mt-3">
                        <button class="button button-buy is-success">Comprar</button>
                        <button class="button button-reviews is-info" data-id="${
                            book.id
                        }">Ver Avaliações <span class="reviews-count tag is-light ml-1">0</span></button>
                    </div>
                </div>
            </div>
        </div>`;
    return div;
}

function calculateShipping(id, cep) {
    fetch('/api/shipping/' + cep)
        .then((data) => {
            if (data.ok) {
                return data.json();
            }
            throw data.statusText;
        })
        .then((data) => {
            swal('Frete', `O frete é: R$${data.value.toFixed(2)}`, 'success');
        })
        .catch((err) => {
            swal('Erro', 'Erro ao consultar frete', 'error');
            console.error(err);
        });
}

function fetchReviews(bookId) {
    fetch(`/api/reviews/${bookId}`)
        .then((data) => {
            if (data.ok) {
                return data.json();
            }
            throw data.statusText;
        })
        .then((data) => {
            if (data && data.reviews) {
                // Update the review count badge
                const reviewCountBadge = document.querySelector(`.book[data-id="${bookId}"] .reviews-count`);
                if (reviewCountBadge) {
                    reviewCountBadge.textContent = data.reviews.length;
                }

                // Display reviews in a modal
                let reviewsHtml = '';
                if (data.reviews.length === 0) {
                    reviewsHtml = '<p>Nenhuma avaliação disponível para este livro.</p>';
                } else {
                    reviewsHtml = '<div class="reviews-list">';
                    data.reviews.forEach((review) => {
                        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                        const date = new Date(review.date).toLocaleDateString('pt-BR');
                        reviewsHtml += `
                            <div class="review-item box">
                                <div class="review-header">
                                    <strong>${review.username}</strong>
                                    <span class="stars has-text-warning">${stars}</span>
                                    <span class="date is-size-7">${date}</span>
                                </div>
                                <p>${review.comment}</p>
                            </div>
                        `;
                    });
                    reviewsHtml += '</div>';
                }

                reviewsHtml += `
                    <hr />
                    <h4 class="subtitle">Adicionar avaliação</h4>
                    <form id="add-review-form" data-book-id="${bookId}">
                        <div class="field">
                            <label class="label">Seu nome</label>
                            <div class="control">
                                <input class="input" type="text" id="review-username" required>
                            </div>
                        </div>
                        <div class="field">
                            <label class="label">Avaliação (1-5)</label>
                            <div class="control">
                                <div class="select">
                                    <select id="review-rating">
                                        <option value="5">5 - Excelente</option>
                                        <option value="4">4 - Muito bom</option>
                                        <option value="3">3 - Bom</option>
                                        <option value="2">2 - Regular</option>
                                        <option value="1">1 - Ruim</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="field">
                            <label class="label">Comentário</label>
                            <div class="control">
                                <textarea class="textarea" id="review-comment" required></textarea>
                            </div>
                        </div>
                        <div class="field">
                            <div class="control">
                                <button type="submit" class="button is-primary">Enviar avaliação</button>
                            </div>
                        </div>
                    </form>
                `;

                swal({
                    title: 'Avaliações',
                    content: {
                        element: 'div',
                        attributes: {
                            innerHTML: reviewsHtml,
                        },
                    },
                    buttons: {
                        confirm: {
                            text: 'Fechar',
                            value: true,
                            visible: true,
                            closeModal: true,
                        },
                    },
                });

                // Add event listener to the review form
                const form = document.getElementById('add-review-form');
                if (form) {
                    form.addEventListener('submit', function (e) {
                        e.preventDefault();
                        const bookId = this.getAttribute('data-book-id');
                        const reviewData = {
                            productId: parseInt(bookId),
                            username: document.getElementById('review-username').value,
                            rating: parseInt(document.getElementById('review-rating').value),
                            comment: document.getElementById('review-comment').value,
                        };

                        submitReview(reviewData, bookId);
                    });
                }
            }
        })
        .catch((err) => {
            swal('Erro', 'Erro ao carregar avaliações', 'error');
            console.error(err);
        });
}

function submitReview(reviewData, bookId) {
    fetch('/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Falha ao enviar avaliação');
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                swal('Sucesso', 'Avaliação enviada com sucesso!', 'success');
                // Refetch reviews to update the count
                fetchReviews(bookId);
            } else {
                swal('Erro', data.message || 'Erro ao enviar avaliação', 'error');
            }
        })
        .catch((error) => {
            swal('Erro', 'Erro ao enviar avaliação', 'error');
            console.error('Error:', error);
        });
}

function loadReviewCounts() {
    // Get all book IDs
    const bookElements = document.querySelectorAll('.book');
    bookElements.forEach((bookElem) => {
        const bookId = bookElem.getAttribute('data-id');
        if (bookId) {
            // Fetch reviews just to update the count
            fetch(`/api/reviews/${bookId}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data && data.reviews) {
                        // Update review count
                        const countElement = bookElem.querySelector('.reviews-count');
                        if (countElement) {
                            countElement.textContent = data.reviews.length;
                        }
                    }
                })
                .catch((error) => console.error(`Error fetching reviews for book ${bookId}:`, error));
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const books = document.querySelector('.books');

    fetch('/api/products')
        .then((data) => {
            if (data.ok) {
                return data.json();
            }
            throw data.statusText;
        })
        .then((data) => {
            if (data) {
                data.forEach((book) => {
                    books.appendChild(newBook(book));
                });

                document.querySelectorAll('.button-shipping').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        const cep = document.querySelector(`.book[data-id="${id}"] input`).value;
                        calculateShipping(id, cep);
                    });
                });

                document.querySelectorAll('.button-buy').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        swal('Compra de livro', 'Sua compra foi realizada com sucesso', 'success');
                    });
                });

                // Add event listeners for the review buttons
                document.querySelectorAll('.button-reviews').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id') || e.target.parentElement.getAttribute('data-id');
                        fetchReviews(id);
                    });
                });

                // Load initial review counts
                loadReviewCounts();
            }
        })
        .catch((err) => {
            swal('Erro', 'Erro ao listar os produtos', 'error');
            console.error(err);
        });
});
