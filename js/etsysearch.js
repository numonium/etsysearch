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
			search : (args && args.search.ele ? args.search.ele : '')
		};
		
		this.forms = {
			search : (args && args.search.form ? args.search.form : '')
		};
		
		this.urls = {
			search : 'https://openapi.etsy.com/v2/listings/active.js?keywords=' + _.str.token('terms') + '&limit=12&includes=Images:1&api_key=' + _.str.token('key')
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
					var q = _.str.tokenReplace(__t.urls.search,_.str.token('terms'),val);
					
					if(val && __t.eles.search && (__t.eles.search.value == '')){
						__t.eles.search.value = val;
					}
					
					$.ajax({
						url : q,
						dataType : 'jsonp',
						success : function(data){
							_.log('api[etsysearch][search][*]',q,data);
						},
						error : function(data){
							_.log('api[etsysearch][search][*err]',q,data);
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
					
					_.log('#!!!',url);
					window.location.href = url;
					
					return false;
				}	
			}
		},
		init : function(args){
			
			if(this.cfg.key){
				this.urls.search = _.str.tokenReplace(this.urls.search,_.str.token('key'),this.cfg.key);
			}

			if(this.forms.search){
				$(this.forms.search).submit($.proxy(this.e.search.submit,this));
			}
			
			window.addEventListener('hashchange',this.e.hashchange);
			
			this.e.hashchange();

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
				form : $('._-form._-form--search').get(0)
			}
		});
		
	});
	
})(_, jQuery);