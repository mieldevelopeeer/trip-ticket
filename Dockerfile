# Use PHP 8.1 with Apache
FROM php:8.1-apache

# 1. Install system dependencies & PHP extensions
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libzip-dev \
    libonig-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo_mysql gd zip mbstring

# 2. Enable Apache mod_rewrite for Laravel routing
RUN a2enmod rewrite

# 3. Set the working directory
WORKDIR /var/www/html

# 4. Copy application code with correct ownership
COPY --chown=www-data:www-data . /var/www/html

# 5. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 6. Fix Permissions
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 7. Configure Apache Document Root
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 8. Set up the Startup Script
# Copy your deploy.sh and make it the "Entrypoint"
RUN chmod +x /var/www/html/deploy.sh

# Use the port Render provides
EXPOSE 80

# Run the deploy script (this will run migrations then start apache)
ENTRYPOINT ["/var/www/html/deploy.sh"]
