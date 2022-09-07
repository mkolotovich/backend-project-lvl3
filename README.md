# JavaScript Проект - «Загрузчик страниц»
## Описание
PageLoader – утилита командной строки, которая скачивает страницы из интернета и сохраняет их на компьютере. Вместе со страницей она скачивает все ресурсы (картинки, стили и js) давая возможность открывать страницу без интернета.

## Установка приложения и запуска игр
1. Убедитесь, что у вас установлена Node.js версии 13 и выше. В противном случае установите Node.js версии 13 и выше.
2. Установите пакет в систему с помощью npm link и убедитесь в том, что он работает, запустив page-loader -h в терминале. Команду npm link необходимо запускать из корневой директории проекта.
3. Пример использования:
```
page-loader --output /var/tmp https://ru.hexlet.io/courses

✔ https://ru.hexlet.io/lessons.rss
✔ https://ru.hexlet.io/assets/application.css
✔ https://ru.hexlet.io/assets/favicon.ico
✔ https://ru.hexlet.io/assets/favicon-196x196.png
✔ https://ru.hexlet.io/assets/favicon-96x96.png
✔ https://ru.hexlet.io/assets/favicon-32x32.png
✔ https://ru.hexlet.io/assets/favicon-16x16.png
✔ https://ru.hexlet.io/assets/favicon-128.png

Page was downloaded as 'ru-hexlet-io-courses.html'
```
### Hexlet tests and linter status:
[![Actions Status](https://github.com/mkolotovich/backend-project-lvl3/workflows/hexlet-check/badge.svg)](https://github.com/mkolotovich/backend-project-lvl3/actions)
[![Actions Status](https://github.com/mkolotovich/backend-project-lvl3/actions/workflows/ESLint&tests.yml/badge.svg)](https://github.com/mkolotovich/frontend-project-lvl3/actions)
[![Maintainability](https://api.codeclimate.com/v1/badges/c26fd5ed72cd12cb4780/maintainability)](https://codeclimate.com/github/mkolotovich/backend-project-lvl3/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c26fd5ed72cd12cb4780/test_coverage)](https://codeclimate.com/github/mkolotovich/backend-project-lvl3/test_coverage)
[![asciicast](https://asciinema.org/a/8u6lsBNn6RFTp67tbuNP3C5Nz.svg)](https://asciinema.org/a/8u6lsBNn6RFTp67tbuNP3C5Nz)
[![asciicast](https://asciinema.org/a/Zpvpy8VTMjdFFpjuMbalXBGAI.svg)](https://asciinema.org/a/Zpvpy8VTMjdFFpjuMbalXBGAI)
[![asciicast](https://asciinema.org/a/PacgSp51kZm58wvrdJDZCoIC7.svg)](https://asciinema.org/a/PacgSp51kZm58wvrdJDZCoIC7)
[![asciicast](https://asciinema.org/a/wxeBFRbAlkxo45vwdiceN0GqJ.svg)](https://asciinema.org/a/wxeBFRbAlkxo45vwdiceN0GqJ)
[![asciicast](https://asciinema.org/a/L7xCVueTNOVLM0sVmbgjB6fM3.svg)](https://asciinema.org/a/L7xCVueTNOVLM0sVmbgjB6fM3)
[![asciicast](https://asciinema.org/a/5BoOiGxL7h4YKJxUmLdZOho1A.svg)](https://asciinema.org/a/5BoOiGxL7h4YKJxUmLdZOho1A)
