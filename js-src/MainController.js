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
			term_unit: null,
			term_start: null,
			term_end: null,
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
	handleInput = (k, e) => this.setState({ [k]: e.target.value });
	
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
					{
						(() => {
							const formatter = (name, placeholder, props) => 
									<span className="input-outer-wrapper">
										<span className="input-inner-wrapper">
											<input type="text" placeholder={placeholder} id={`term_${name}`} name={`term_${name}`} onChange={e => this.handleInput(`term_${name}`, e)} value={this.state[`term_${name}`] || ''} ref={this[`term_${name}_ref`]} {...props} />
											{ (this.state.n_request > this.state.n_fulfilled) && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div> }
										</span>
										<label htmlFor={`term_${name}`}>{name}</label>
									</span>;
							return <ul className="flat-list" id="input_container">
								<li>
									{formatter('start', 'Starting # (e.g. 17)')}
									{formatter('unit', 'Unit (e.g. mph)')}
								</li>
								<li id="convert_cell">
									<span className="select-wrapper">
										<select name="unit_pool">
											<option value="EXOTIC" key={1} selected={true}>Exotic units</option>
											<option value="WIKI" key={2}>Wikipedia units</option>
											<option value="CHEAT" key={3}>Cheating units</option>
										</select>
									</span>
									<span className="arrow"></span>
								</li>
								<li>
									{formatter('end', 'Ending # (e.g. 45)')}
									{formatter('unit', 'Unit', { disabled: true, id: 'term_unit_mirror' })}
								</li>
							</ul>;
						})()
					}
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
					<ul id="result_list">
						{ this.state.result.path.map((n, i) =>
							<li key={i}>
								<React.Fragment>
									<span className="result-size">{ (n.fro / n.factor).toFixed(3) }</span>
									&nbsp;<span className="result-unit">{ n.vto_unit }</span>
									&nbsp;<span className="result-long-unit">({n.vto_unit_long})</span>
									&nbsp;<span className="result-rounding">
										rounded to
										&nbsp;<span className="result-size">{ Math.round(n.fro / n.factor) }</span>
										&nbsp;<span className="result-unit">{ n.vto_unit }</span>
											&nbsp;<span className="result-aka">
												(AKA {(Math.round(n.fro / n.factor) * n.factor / this.state.result.unit_factor).toFixed(2)}
												&nbsp;{this.state.result.unit})
											</span>
										{/*&nbsp;<span>, which is</span>*/}
									</span>
								</React.Fragment>
							</li>) }
					</ul>
					<h2>&hellip;which is {Math.round(this.state.result.end)} {this.state.result.unit} (up to rounding error)</h2>
				</section>
			}
	</div>
}