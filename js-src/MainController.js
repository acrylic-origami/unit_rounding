import React from 'react';

export default class extends React.Component {
	constructor(props) {
		super(props);
		this.form_ref = React.createRef();
		this.term_unit_ref = React.createRef();
		this.term_start_ref = React.createRef();
		this.term_end_ref = React.createRef();
		
		this.state = {
			result: null,
			n_request: 0,
			n_fulfilled: 0,
			request: null,
			err: null,
			copying: false
		};
		window.addEventListener('popstate', this.handle_uri_term);
	}
	componentDidMount() {
		this.term_unit_ref.current.focus();
		this.handle_uri_term();
	}
	handle_uri_term = () => {
		// const term_raw = (new URLSearchParams(window.location.search)).get('term_raw');
		// if(term_raw != null) {
		// 	this.term_raw_ref.current.value = term_raw;
		// 	this.setState(s => ({ term_raw, n_request: s.n_request + 1 }));
		// }
	}
	
	onSubmit = e => {
		history.pushState({}, `search`, ['unit', 'start', 'end'].map(a => `?term_${a}=${encodeURI(this[`term_${a}_ref`].current.value)}`).join('&'));
		this.setState(({ n_request }) => ({ n_request: n_request + 1 }));
		e.preventDefault();
	}
	
	componentDidUpdate(_, l) {
		if(this.state.err !== null && !this.state.err[1]) {
			const this_err = this.state.err[0];
			this.setState(({ err }) => err !== null && (err[0] === this_err ? { err: [this_err, true] } : {}));
			setTimeout(_ => this.setState(({ err }) => err !== null && (err[0] === this_err ? { err: null } : {})), 4000);
		}
		if(l.n_request != this.state.n_request) {
			const n_request_stash = this.state.n_request;
			const [unit, start, end] = [this.term_unit_ref, this.term_start_ref, this.term_end_ref].map(a => a.current.value
				.trim()
				.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
				
			const fail = e => {
				console.log(e);
				this.setState(s => (n_request_stash === s.n_request) && { err: [e.message, false], n_fulfilled: n_request_stash });
			}
			fetch(`/end/q`, { method: 'POST', body: new FormData(this.form_ref.current) })
				.then(r => r.json().then(j => { if(r.ok) return j; else throw new Error(j.err); }))
				.then(r => this.setState(s => (n_request_stash === s.n_request) && { result: r, n_fulfilled: n_request_stash }), fail);
		}
	}
			
	render = () => <div>
		<section>
				<form onSubmit={this.onSubmit} id="term_form" ref={this.form_ref}>
					{[
						['unit', 'Unit (e.g. mph, gal/min, g*mm2)'],
						['start', 'Starting number (e.g. 17)'],
						['end', 'Ending number (e.g. 45)']
					].map(([name, placeholder], i) => <React.Fragment key={i}>
						<input key={name} type="text" placeholder={placeholder} id={`term_${name}`} name={`term_${name}`} ref={this[`term_${name}_ref`]} />
						{ (this.state.n_request > this.state.n_fulfilled) && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div> }
					</React.Fragment>
					)}
					<span className="select-wrapper">
						<select name="unit_pool">
							<option value="WIKI" key={1}>Wikipedia units</option>
							<option value="EXOTIC" key={2}>Exotic units</option>
							<option value="CHEAT" key={3}>Cheating units</option>
						</select>
					</span>
					<input type="submit" />
				</form>
			</section>
			{ this.state.result != null
				? null
				: <section id="results_placeholder">
					Results appear after entering units and pressing <kbd>Enter</kbd>
				</section>
			}
			{
				this.state.err == null
					? null
					: <section id="error" className="group">
						<span>Error: {this.state.err[0]}</span>
					</section>
			}
			{ this.state.result && 
				<section id="results">
					<h2>{this.state.result.start} {this.state.result.unit} is:</h2>
					<ul>
						{ this.state.result.path.map((n, i) =>
							<li key={i}>
								<React.Fragment>
									{ (n.fro / n.factor).toFixed(3) }
									&nbsp;{ n.vto_unit } ({n.vto_unit_long})
									&nbsp;rounded to
									&nbsp;{ Math.round(n.fro / n.factor) }
									&nbsp;{ n.vto_unit }
										&nbsp;(AKA {(Math.round(n.fro / n.factor) * n.factor / this.state.result.unit_factor).toFixed(2)}
										&nbsp;{this.state.result.unit}).
								</React.Fragment>
							</li>) }
					</ul>
					<h2>&hellip;which is {Math.round(this.state.result.end)} {this.state.result.unit} (up to rounding error)</h2>
				</section>
			}
	</div>
}