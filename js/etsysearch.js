(function(_, $){
	
	var __t;
	
	_._.EtsySearch = function(args){
		
		__t = this;

		this.cfg = (args && args.cfg ? args.cfg : {
			appName : '',
			key : '',
			sharedSecret : ''
		});
		
		this.cfg.hashbang = '#!';
		
		this.eles = {
			search : (args && args.search.ele ? args.search.ele : ''),
			results : (args && args.search.results ? args.search.results : ''), 
		};
		
		this.forms = {
			search : (args && args.search.form ? args.search.form : '')
		};
		
		this.str = {
			titles : {
				_stub : ' - EtsySearch&trade;',
				err : 'Error :(',
				loading : 'Searching for "' + _.str.token('q') + '"...',
				results : _.str.token('num') + ' Results for "' + _.str.token('q') + '"'
			}
		};
		
		this.tem = {
			result : null
		};
		
		this.urls = {
			search : 'https://openapi.etsy.com/v2/listings/active.js?keywords=' + _.str.token('terms') + '&limit=32&includes=Images:1&api_key=' + _.str.token('key')
		};
		
		this.init();
		
	};
	
	var __proto = {
		e : {
			hashchange : function(e){
				
				var hash = window.location.hash.split('/');
				hash.shift(); // remove hashbang from url
				
				var cmd = hash.shift();
				
				if(cmd == 'search'){
					return __t.e.search.q({
						q : hash.shift()
					});
				}
			},
			search : {
				q : function(args){
					var val = (args && args.q ? args.q : __t.eles.search.value);
					__t.q = val;
					
					var q = _.str.tokenReplace(__t.urls.search,_.str.token('terms'),val);
					
					if(val && __t.eles.search && (__t.eles.search.value == '')){
						__t.eles.search.value = val;
					}
					
					_.log('api[etsysearch][q][?]',val,q);
					
					__t.title(_.str.tokenReplace(__t.str.titles.loading,_.str.token('q'),__t.q));
					__t.eles.results.setAttribute('data-_-state','loading');
					
					$.ajax({
						url : q,
						dataType : 'jsonp',
						success : function(data){
							_.log('api[etsysearch][q][*]',q,data);
							
							return __t.results({
								data : data,
								type : (!data.ok ? 'err' : (data.count === 0 ? 'empty' : '*'))
							});
							
						},
						error : function(data){
							_.log('api[etsysearch][q][*err]',q,data);
							
							return __t.results({
								data : data,
								type : 'err'
							});
						}
					});
				},
				submit : function(e){
					
					if(!this.eles.search){
						return false;
					}
					
					var url = this.url({
						svc : 'search',
						val : this.eles.search.value
					});
					
					_.log('api[etsysearch][q][->]',url);
					window.location.href = url;
					
					return false;
				}	
			}
		},
		init : function(args){
			
			if(this.cfg.key){
				this.urls.search = _.str.tokenReplace(this.urls.search,_.str.token('key'),this.cfg.key);
			}
			
			this.eles.resultsList = this.eles.results.getElementsByClassName('_-listing--results')[0];
			
			// get template for new result
			var result = document.getElementsByClassName('_-form--search--results--results')[0].getElementsByClassName('_-listing--item _-blank')[0];
			this.tem.result = result.cloneNode(true);
			result.parentNode.removeChild(result);

			_.log('@@@@',this.tem.result);

			if(this.forms.search){
				$(this.forms.search).submit($.proxy(this.e.search.submit,this));
			}
			
			window.addEventListener('hashchange',this.e.hashchange);
			
			this.e.hashchange();

		},
		makeResult : function(data){
			if(!data || (data.state == 'banned')){
				return false;
			}
				
			var result = {};
			
			result._ = this.tem.result.cloneNode(true);
			result._.setAttribute('data-_-item-uuid', data.listing_id);

			result.a = result._.getElementsByClassName('_-listing--item--link')[0];
			result.a.href = data.url;
			
			result.title = result._.getElementsByClassName('_-listing--item--title')[0];
			result.title.appendChild(document.createTextNode(data.title));
			
			result.cat = result._.getElementsByClassName('_-listing--item--cat')[0];
			result.cat.appendChild(document.createTextNode('in: '));
			var tmp = document.createElement('strong');
			tmp.appendChild(document.createTextNode(data.category_path ? data.category_path[0] : 'Unknown'));
			result.cat.appendChild(tmp);
			
			result.content = result._.getElementsByClassName('_-listing--item--content')[0];
			tmp = document.createElement('p');
			tmp.appendChild(document.createTextNode(data.description));
			result.content.appendChild(tmp);
			
			result.img = result._.getElementsByClassName('_-listing--item--img')[0].getElementsByTagName('img')[0];
			result.img.src = data.Images[0].url_170x135;
						
			_.log('api[etsysearch][result][+]',result);
			
			return result;

		},
		results : function(args){
			if(!args){
				return false;
			}
			
			if(args.type == 'err'){
				this.title(this.titles.err);
			}else if(args.type == 'empty'){
				
				var title = _.str.tokenReplace(this.str.titles.results,_.str.token('num'),'No');
				title = _.str.tokenReplace(title,_.str.token('q'),this.q);
				
				this.title(title);
			}else{
				var title = _.str.tokenReplace(this.str.titles.results,_.str.token('num'),args.data.count);
				title = _.str.tokenReplace(title,_.str.token('q'),this.q);
				this.title(title);
			}
			
			this.eles.results.setAttribute('data-_-state', args.type);
			
			if(!args.data.count){
				return false;
			}
			
			var result = null;
			__t.eles.resultsList.innerHTML='';
			
			for(var i in args.data.results){
				if(!args.data.results.hasOwnProperty(i)){
					continue;
				}

				if(result = __t.makeResult(args.data.results[i])){
					__t.eles.resultsList.appendChild(result._);
				}
				
			}
			
/*
	
			<a class="_-listing--item--link" href="">
				<div class="_-listing--item--title--wrapper">
					<h2 class="_-listing--item--title"></h2>
				</div>
				<div class="_-listing--item--cat--wrapper">
					<h3 class="_-listing--item--cat"></h3>
				</div>
				<div class="_-listing--item--content--wrapper">
					<div class="_-listing--item--content"></div>
				</div>
			</a>
*/			

			
			_.log('api[etsysearch][results]',this,args.data,args.type);
		},
		title : function(str){
			document.title = str + this.str.titles._stub;	
		},
		url : function(args,remote){
			if(!args || !args.svc){
				return false;
			}
			
			var val = args.val ? encodeURIComponent(args.val) : '';
			
			return (!remote ? this.cfg.hashbang : '') + '/' + args.svc + '/' + val;
		}
	};
	
	for(var i in __proto){
		if(__proto.hasOwnProperty(i)){
			_._.EtsySearch.prototype[i] = __proto[i];
		}
	}
	
	$(document).ready(function(){
	
		_.api.etsysearch = new _._.EtsySearch({
			cfg : {
				appName : 'EtsySearch',
				key 	: 'qbwpeyzkq805zht4ky91s9x0',
				sharedSecret : '1ts8ofw6oy'
			},
			search : {
				ele : $('._-form._-form--search ._-form--search--q').get(0),
				form : $('._-form._-form--search').get(0),
				results : $('._-form--search--results').get(0)
			}
		});
		
	});
	
})(_, jQuery);