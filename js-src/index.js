import React from 'react';
import ReactDOM from 'react-dom';
import MainController from './MainController'

window.addEventListener('load', () => {
	ReactDOM.render(
		<MainController />, //
		document.getElementById('root'));
});