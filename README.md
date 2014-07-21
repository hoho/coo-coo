coocoo
======

Domain-specific language to create MVC applications

Versions 0.0.x are unstable and could be backwards incompatible. First
version to use will be 0.1.0 (and it looks like never gonna happen).

Introduction
------------

CooCoo uses indentation for code blocks.

Here is an application source example.

    application
        construct
            // Application entry point.
            ^(document.body)
                // Render Page view to <body>
                *view Page render


    view Page
        ^render
            // Return template call result.
            *template "conkitty:page" apply
