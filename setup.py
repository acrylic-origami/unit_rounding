from setuptools import setup

setup(
   name='x2585',
   version='1.0',
   description='Implements x2585',
   author='Derek Lam',
   author_email='derek@lam.io',
   packages=['x2585'],  #same as name
   install_requires=['click', 'dataclasses', 'Flask', 'importlib-metadata', 'itsdangerous', 'Jinja2', 'MarkupSafe', 'psycopg2', 'pyparsing', 'typing-extensions', 'Werkzeug', 'zipp'], #external packages as dependencies
)
